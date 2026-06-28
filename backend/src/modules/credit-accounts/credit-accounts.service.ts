import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { DataSource, EntityManager } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountTransaction } from '@/modules/credit-accounts/entities/credit-account-transaction.entity';
import { CreditAccountsRepository } from '@/modules/credit-accounts/credit-accounts.repository';
import { CreditAccountTransactionsRepository } from '@/modules/credit-accounts/credit-account-transactions.repository';
import { CreateCreditAccountRequestDto } from '@/modules/credit-accounts/dto/create-credit-account-request.dto';
import { ApproveCreditAccountDto } from '@/modules/credit-accounts/dto/approve-credit-account.dto';
import { RejectCreditAccountDto } from '@/modules/credit-accounts/dto/reject-credit-account.dto';
import { UpdateCreditAccountDto } from '@/modules/credit-accounts/dto/update-credit-account.dto';
import { ListCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/list-credit-accounts-query.dto';
import { SearchCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/search-credit-accounts-query.dto';
import { ReceiveCreditAccountPaymentDto } from '@/modules/credit-accounts/dto/receive-credit-account-payment.dto';
import { AuthorizeOverrideDto } from '@/modules/credit-accounts/dto/authorize-override.dto';
import {
  addDaysUtc,
  allocateFifo,
  overdueDays,
} from '@/modules/credit-accounts/lib/credit-account-math';
import type {
  CreditAccountSearchResult,
  CreditAccountRow,
  CreditAccountAgeing,
  CreditAccountStatement,
  CreditAccountTransactionRow,
  CreditAccountOutstandingSale,
  CreditOverrideAuthorization,
} from '@/modules/credit-accounts/types';
import { Sale } from '@pos/entities/sale.entity';
import { assertWithinCreditLimit } from '@pos/lib/credit-limit';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { UsersService } from '@users/users.service';
import { AccountingService } from '@accounting/accounting.service';
import { ACCOUNT_CODES } from '@accounting/types/account-code.type';
import type { AuthUser } from '@common/types/auth-user.type';

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface NotifyPayload {
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

interface OverrideTokenPayload {
  scope: string;
  accountId: string;
  cap: number;
  sub: string;
}

/** Validated, locked context handed from {@link prepareCharge} to commit. */
export interface CreditChargeContext {
  account: CreditAccount;
  dueDate: string;
  overrideByUserId: string | null;
}

/**
 * Customer store-credit ("khata") accounts: the enrollment → approval
 * lifecycle, the manager listing with ageing, per-account statements, and
 * repayments (FIFO settle + ledger posting). POS charge/override lands in
 * Phase 4. Accounts are branch-owned, so non-admins are scoped to their own
 * branch throughout.
 */
@Injectable()
export class CreditAccountsService {
  private readonly logger = new Logger(CreditAccountsService.name);

  constructor(
    private readonly accounts: CreditAccountsRepository,
    private readonly transactions: CreditAccountTransactionsRepository,
    private readonly accounting: AccountingService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly users: UsersService,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  /** Cashier submits the enrollment form → a PENDING account; managers notified. */
  async request(
    dto: CreateCreditAccountRequestDto,
    actor: AuthUser,
  ): Promise<CreditAccount> {
    const branchId = this.resolveBranch(actor, dto.branchId);
    const holderName = dto.holderName.trim();
    const phone = dto.phone.trim();
    if (!holderName) throw new BadRequestException('Customer name is required');
    if (!phone) throw new BadRequestException('Phone number is required');

    const existing = await this.accounts.findByBranchAndPhone(branchId, phone);
    if (existing) {
      throw new ConflictException(
        `A credit account for ${phone} already exists at this branch`,
      );
    }

    const accountNo = await this.generateAccountNo();
    const saved = await this.accounts.save(
      this.accounts.create({
        accountNo,
        holderName,
        phone,
        nic: dto.nic?.trim() || null,
        address: dto.address?.trim() || null,
        branchId,
        status: CreditAccountStatus.PENDING,
        requestedCreditLimit: dto.requestedCreditLimit ?? null,
        requestedByUserId: actor.id,
        requestNote: dto.note?.trim() || null,
      }),
    );

    await this.notifyManagers(branchId, {
      title: 'New credit account request',
      message: `Credit account requested for ${holderName} (${phone})`,
      metadata: {
        event: 'created',
        creditAccountId: saved.id,
        holderName,
        phone,
        branchId,
      },
    });

    return this.findOrThrow(saved.id);
  }

  async list(
    query: ListCreditAccountsQueryDto,
    actor: AuthUser,
  ): Promise<CreditAccountRow[]> {
    const branchId = this.resolveBranchScope(actor, query.branchId);
    const accounts = await this.accounts.list({
      status: query.status,
      branchId,
      search: query.search?.trim() || undefined,
    });
    if (accounts.length === 0) return [];
    const ageing = await this.accounts.ageingByAccounts(
      accounts.map((account) => account.id),
    );
    return accounts.map((account) =>
      this.toRow(account, ageing.get(account.id)),
    );
  }

  async getById(id: string, actor: AuthUser): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    return account;
  }

  /** PENDING → ACTIVE (or resume SUSPENDED → ACTIVE): set limit + term. */
  async approve(
    id: string,
    dto: ApproveCreditAccountDto,
    actor: AuthUser,
  ): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    if (
      account.status !== CreditAccountStatus.PENDING &&
      account.status !== CreditAccountStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        `Cannot approve an account in "${account.status}" status`,
      );
    }

    account.status = CreditAccountStatus.ACTIVE;
    account.creditLimit = round2(dto.creditLimit);
    account.creditTermDays = dto.creditTermDays;
    account.approvalNote = dto.approvalNote?.trim() || null;
    account.rejectionReason = null;
    account.reviewedByUserId = actor.id;
    account.reviewedAt = new Date();
    const saved = await this.accounts.save(account);

    await this.notifyUser(account.requestedByUserId, {
      title: 'Credit account approved',
      message: `${account.holderName} can now buy on credit — limit ${saved.creditLimit}, ${saved.creditTermDays} days to settle`,
      metadata: {
        event: 'approved',
        creditAccountId: account.id,
        creditLimit: saved.creditLimit,
        creditTermDays: saved.creditTermDays,
      },
    });

    return this.findOrThrow(saved.id);
  }

  /** PENDING → REJECTED, with a reason; the requesting cashier is notified. */
  async reject(
    id: string,
    dto: RejectCreditAccountDto,
    actor: AuthUser,
  ): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    if (account.status !== CreditAccountStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject an account in "${account.status}" status`,
      );
    }
    const reason = dto.rejectionReason.trim();
    if (!reason)
      throw new BadRequestException('A rejection reason is required');

    account.status = CreditAccountStatus.REJECTED;
    account.rejectionReason = reason;
    account.reviewedByUserId = actor.id;
    account.reviewedAt = new Date();
    const saved = await this.accounts.save(account);

    await this.notifyUser(account.requestedByUserId, {
      title: 'Credit account rejected',
      message: `${account.holderName}'s credit request was rejected: ${reason}`,
      metadata: {
        event: 'rejected',
        creditAccountId: account.id,
        rejectionReason: reason,
      },
    });

    return saved;
  }

  /** ACTIVE → SUSPENDED: blocks new credit; balance + history preserved. */
  async suspend(id: string, actor: AuthUser): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    if (account.status !== CreditAccountStatus.ACTIVE) {
      throw new BadRequestException('Only active accounts can be suspended');
    }
    account.status = CreditAccountStatus.SUSPENDED;
    return this.accounts.save(account);
  }

  /** ACTIVE/SUSPENDED → CLOSED (terminal). History is kept for the record. */
  async close(id: string, actor: AuthUser): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    if (account.status === CreditAccountStatus.PENDING) {
      throw new BadRequestException('Reject the request instead of closing it');
    }
    if (account.status === CreditAccountStatus.CLOSED) {
      throw new BadRequestException('Account is already closed');
    }
    account.status = CreditAccountStatus.CLOSED;
    return this.accounts.save(account);
  }

  /** Manager edits the limit/term of an ACTIVE/SUSPENDED account. */
  async update(
    id: string,
    dto: UpdateCreditAccountDto,
    actor: AuthUser,
  ): Promise<CreditAccount> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    if (
      account.status !== CreditAccountStatus.ACTIVE &&
      account.status !== CreditAccountStatus.SUSPENDED
    ) {
      throw new BadRequestException(
        `Cannot edit an account in "${account.status}" status`,
      );
    }
    if (dto.creditLimit !== undefined) {
      account.creditLimit = round2(dto.creditLimit);
    }
    if (dto.creditTermDays !== undefined) {
      account.creditTermDays = dto.creditTermDays;
    }
    return this.accounts.save(account);
  }

  async search(
    query: SearchCreditAccountsQueryDto,
    actor: AuthUser,
  ): Promise<CreditAccountSearchResult[]> {
    const branchId = this.resolveBranch(actor, query.branchId);
    const q = query.q.trim();
    if (!q) return [];
    const rows = await this.accounts.search({ branchId, q, limit: 10 });
    return rows.map((account) => this.toSearchResult(account));
  }

  /** Full statement: balance, ageing, ledger history, and unpaid bills. */
  async getStatement(
    id: string,
    actor: AuthUser,
  ): Promise<CreditAccountStatement> {
    const account = await this.findOrThrow(id);
    this.assertBranchAccess(actor, account);
    const [transactions, outstanding, ageingMap] = await Promise.all([
      this.transactions.findByAccountId(id),
      this.accounts.outstandingSales(id),
      this.accounts.ageingByAccounts([id]),
    ]);
    const asOf = new Date();
    const creditLimit =
      account.creditLimit === null ? null : Number(account.creditLimit);
    const currentBalance = Number(account.currentBalance);
    return {
      id: account.id,
      accountNo: account.accountNo,
      holderName: account.holderName,
      phone: account.phone,
      nic: account.nic,
      address: account.address,
      branchId: account.branchId,
      branchName: account.branch?.name ?? null,
      status: account.status,
      creditLimit,
      creditTermDays:
        account.creditTermDays === null ? null : Number(account.creditTermDays),
      currentBalance,
      availableCredit:
        creditLimit === null ? null : round2(creditLimit - currentBalance),
      ageing: ageingMap.get(id) ?? this.emptyAgeing(),
      transactions: transactions.map((t) => this.toTransactionRow(t)),
      outstandingSales: outstanding.map((s) => this.toOutstandingSale(s, asOf)),
    };
  }

  /**
   * Record a repayment: a Credit_Paid ledger row, balance ↓, FIFO settlement
   * of unpaid credit sales (oldest-due first so ageing stays truthful), and a
   * CREDIT accounting posting — all in one transaction with the account locked.
   */
  async receivePayment(
    id: string,
    dto: ReceiveCreditAccountPaymentDto,
    actor: AuthUser,
  ): Promise<CreditAccountStatement> {
    const amount = round2(dto.amount);
    if (amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    await this.dataSource.transaction(async (manager) => {
      const account = await manager
        .getRepository(CreditAccount)
        .createQueryBuilder('ca')
        .setLock('pessimistic_write')
        .where('ca.id = :id', { id })
        .getOne();
      if (!account) throw new NotFoundException('Credit account not found');
      this.assertBranchAccess(actor, account);
      if (
        account.status === CreditAccountStatus.PENDING ||
        account.status === CreditAccountStatus.REJECTED
      ) {
        throw new BadRequestException(
          'Cannot record a payment on a non-approved account',
        );
      }

      const newBalance = round2(Number(account.currentBalance) - amount);
      const referenceNo = `CRPAY-${randomUUID().slice(0, 8).toUpperCase()}`;

      await this.transactions.create(
        {
          creditAccountId: id,
          saleId: null,
          transactionType: 'Credit_Paid',
          amount,
          runningBalance: newBalance,
          referenceNo,
          notes: dto.notes?.trim() || `Credit payment via ${dto.method}`,
        },
        manager,
      );
      await manager
        .getRepository(CreditAccount)
        .update(id, { currentBalance: newBalance });

      // FIFO-settle unpaid credit sales, oldest-due first.
      const unpaid = await manager
        .getRepository(Sale)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.credit_account_id = :id', { id })
        .andWhere("s.status = 'Active'")
        .andWhere('s.balance_due > 0')
        .orderBy('s.due_date', 'ASC', 'NULLS LAST')
        .addOrderBy('s.created_at', 'ASC')
        .getMany();
      const allocations = allocateFifo(
        unpaid.map((s) => ({ id: s.id, balanceDue: Number(s.balanceDue) })),
        amount,
      );
      for (const alloc of allocations) {
        await manager.getRepository(Sale).update(alloc.id, {
          balanceDue: alloc.newDue,
          paymentStatus: alloc.newDue <= 0 ? 'Paid' : 'Partially_Paid',
        });
      }

      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId: account.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount,
        description: `Credit payment from ${account.holderName} (${dto.method})`,
        referenceNumber: referenceNo,
        accountCode:
          dto.method === 'Cash' ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK,
      });
    });

    return this.getStatement(id, actor);
  }

  /** Validate a manager's credentials and mint a short-lived over-limit token. */
  async authorizeOverride(
    dto: AuthorizeOverrideDto,
    actor: AuthUser,
  ): Promise<CreditOverrideAuthorization> {
    const account = await this.findOrThrow(dto.creditAccountId);
    this.assertBranchAccess(actor, account);

    const manager = await this.users.findByEmail(
      dto.email.trim().toLowerCase(),
    );
    const passwordOk = manager
      ? await bcrypt.compare(dto.password, manager.passwordHash)
      : false;
    if (!manager || !passwordOk) {
      throw new UnauthorizedException('Invalid manager credentials');
    }
    if (manager.role !== UserRole.MANAGER && manager.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only a manager or admin can authorize an over-limit charge',
      );
    }
    if (
      manager.role === UserRole.MANAGER &&
      manager.branchId !== account.branchId
    ) {
      throw new ForbiddenException('Manager is not assigned to this branch');
    }

    const token = await this.jwtService.signAsync({
      scope: 'credit_override',
      accountId: account.id,
      cap: round2(dto.amount),
      sub: manager.id,
    });
    return {
      token,
      authorizedBy: `${manager.firstName} ${manager.lastName}`,
      expiresInSeconds: 300,
    };
  }

  /**
   * POS charge step 1 (before the sale insert): lock the account, assert it is
   * ACTIVE + in-branch, enforce the credit limit (or accept a valid override
   * token), and compute the repayment due date. No mutation yet.
   */
  async prepareCharge(
    manager: EntityManager,
    params: {
      creditAccountId: string;
      actor: AuthUser;
      amount: number;
      overrideToken?: string;
    },
  ): Promise<CreditChargeContext> {
    const account = await manager
      .getRepository(CreditAccount)
      .createQueryBuilder('ca')
      .setLock('pessimistic_write')
      .where('ca.id = :id', { id: params.creditAccountId })
      .getOne();
    if (!account) throw new NotFoundException('Credit account not found');
    this.assertBranchAccess(params.actor, account);
    if (account.status !== CreditAccountStatus.ACTIVE) {
      throw new BadRequestException(
        `Credit account is ${account.status.toLowerCase()} — cannot buy on credit`,
      );
    }

    const amount = round2(params.amount);
    const currentBalance = Number(account.currentBalance);
    const limit =
      account.creditLimit === null ? null : Number(account.creditLimit);
    let overrideByUserId: string | null = null;
    if (limit !== null && round2(currentBalance + amount) > limit) {
      if (!params.overrideToken) {
        // No override supplied → enforce the limit (throws ConflictException).
        assertWithinCreditLimit(limit, currentBalance, amount);
      }
      overrideByUserId = await this.verifyOverrideToken(
        params.overrideToken ?? '',
        account.id,
        amount,
      );
    }

    const dueDate = addDaysUtc(new Date(), account.creditTermDays ?? 0);
    return { account, dueDate, overrideByUserId };
  }

  /**
   * POS charge step 2 (after the sale insert): append the Credit_Taken ledger
   * row and advance the account balance, using the account locked in
   * {@link prepareCharge} within the same transaction.
   */
  async commitChargeWithManager(
    manager: EntityManager,
    params: {
      context: CreditChargeContext;
      saleId: string;
      invoiceNumber: string;
      amount: number;
    },
  ): Promise<void> {
    const { account } = params.context;
    const amount = round2(params.amount);
    const newBalance = round2(Number(account.currentBalance) + amount);
    await this.transactions.create(
      {
        creditAccountId: account.id,
        saleId: params.saleId,
        transactionType: 'Credit_Taken',
        amount,
        runningBalance: newBalance,
        referenceNo: `CR-${params.invoiceNumber}`,
        notes: `Credit taken for invoice ${params.invoiceNumber}`,
      },
      manager,
    );
    await manager
      .getRepository(CreditAccount)
      .update(account.id, { currentBalance: newBalance });
  }

  /**
   * Void reversal: for a credit-account sale, write reversing ledger rows and
   * move the account balance back. No-op for non-credit-account sales.
   */
  async reverseChargeForSale(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    if (!sale.creditAccountId) return;
    const original = await this.transactions.findBySaleId(sale.id);
    if (original.length === 0) return;
    const account = await manager
      .getRepository(CreditAccount)
      .createQueryBuilder('ca')
      .setLock('pessimistic_write')
      .where('ca.id = :id', { id: sale.creditAccountId })
      .getOne();
    let runningBalance = account ? Number(account.currentBalance) : 0;
    for (const txn of original) {
      const amount = Number(txn.amount);
      const reverseType: 'Credit_Taken' | 'Credit_Paid' =
        txn.transactionType === 'Credit_Taken' ? 'Credit_Paid' : 'Credit_Taken';
      const delta = txn.transactionType === 'Credit_Taken' ? -amount : amount;
      runningBalance = round2(runningBalance + delta);
      await this.transactions.create(
        {
          creditAccountId: txn.creditAccountId,
          saleId: sale.id,
          transactionType: reverseType,
          amount,
          runningBalance,
          referenceNo: `VOID-${sale.invoiceNumber}-${txn.id.slice(0, 6)}`,
          notes: `Reverse ${txn.transactionType} from voided invoice ${sale.invoiceNumber}`,
        },
        manager,
      );
    }
    if (account) {
      await manager
        .getRepository(CreditAccount)
        .update(account.id, { currentBalance: runningBalance });
    }
  }

  // ── Internals ──────────────────────────────────────────

  private async verifyOverrideToken(
    token: string,
    accountId: string,
    amount: number,
  ): Promise<string> {
    let payload: OverrideTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<OverrideTokenPayload>(token);
    } catch {
      throw new UnauthorizedException(
        'Override authorization is invalid or has expired',
      );
    }
    if (
      payload.scope !== 'credit_override' ||
      payload.accountId !== accountId ||
      Number(payload.cap) < round2(amount)
    ) {
      throw new ForbiddenException(
        'Override authorization does not match this charge',
      );
    }
    return payload.sub;
  }

  private toSearchResult(account: CreditAccount): CreditAccountSearchResult {
    const creditLimit =
      account.creditLimit === null ? null : Number(account.creditLimit);
    const currentBalance = Number(account.currentBalance);
    return {
      id: account.id,
      accountNo: account.accountNo,
      holderName: account.holderName,
      phone: account.phone,
      status: account.status,
      creditLimit,
      currentBalance,
      availableCredit:
        creditLimit === null ? null : round2(creditLimit - currentBalance),
      creditTermDays:
        account.creditTermDays === null ? null : Number(account.creditTermDays),
    };
  }

  private toRow(
    account: CreditAccount,
    ageing?: CreditAccountAgeing,
  ): CreditAccountRow {
    const creditLimit =
      account.creditLimit === null ? null : Number(account.creditLimit);
    const currentBalance = Number(account.currentBalance);
    return {
      id: account.id,
      accountNo: account.accountNo,
      holderName: account.holderName,
      phone: account.phone,
      nic: account.nic,
      branchId: account.branchId,
      branchName: account.branch?.name ?? null,
      status: account.status,
      creditLimit,
      creditTermDays:
        account.creditTermDays === null ? null : Number(account.creditTermDays),
      currentBalance,
      availableCredit:
        creditLimit === null ? null : round2(creditLimit - currentBalance),
      requestedCreditLimit:
        account.requestedCreditLimit === null
          ? null
          : Number(account.requestedCreditLimit),
      requestNote: account.requestNote,
      approvalNote: account.approvalNote,
      rejectionReason: account.rejectionReason,
      requestedByUserId: account.requestedByUserId,
      requestedByName: this.fullName(account.requestedBy),
      reviewedByName: this.fullName(account.reviewedBy),
      reviewedAt: account.reviewedAt ? account.reviewedAt.toISOString() : null,
      createdAt: account.createdAt.toISOString(),
      ageing: ageing ?? this.emptyAgeing(),
    };
  }

  private fullName(
    user: { firstName: string; lastName: string } | null | undefined,
  ): string | null {
    return user ? `${user.firstName} ${user.lastName}` : null;
  }

  private emptyAgeing(): CreditAccountAgeing {
    return {
      notDue: 0,
      d1to30: 0,
      d31to60: 0,
      d61to90: 0,
      d90plus: 0,
      overdueTotal: 0,
      outstandingTotal: 0,
    };
  }

  private toTransactionRow(
    t: CreditAccountTransaction,
  ): CreditAccountTransactionRow {
    return {
      id: t.id,
      transactionType: t.transactionType,
      amount: Number(t.amount),
      runningBalance: Number(t.runningBalance),
      referenceNo: t.referenceNo,
      notes: t.notes,
      saleId: t.saleId,
      createdAt: t.createdAt.toISOString(),
    };
  }

  private toOutstandingSale(
    sale: Sale,
    asOf: Date,
  ): CreditAccountOutstandingSale {
    const days = overdueDays(sale.dueDate, asOf);
    return {
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      total: Number(sale.total),
      balanceDue: Number(sale.balanceDue),
      dueDate: sale.dueDate,
      createdAt: sale.createdAt.toISOString(),
      overdueDays: days,
      isOverdue: days > 0,
    };
  }

  private async generateAccountNo(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `KH-${randomUUID().slice(0, 8).toUpperCase()}`;
      if (!(await this.accounts.accountNoExists(candidate))) return candidate;
    }
    throw new ConflictException('Could not allocate a unique account number');
  }

  private async findOrThrow(id: string): Promise<CreditAccount> {
    const account = await this.accounts.findById(id);
    if (!account) throw new NotFoundException('Credit account not found');
    return account;
  }

  /** Resolve a concrete owning branch (create/search): admin must specify it. */
  private resolveBranch(actor: AuthUser, requested?: string): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException('branchId is required for admins');
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot act for another branch');
    }
    return actor.branchId;
  }

  /** Resolve a branch *filter* (listing): admin may span all branches (null). */
  private resolveBranchScope(
    actor: AuthUser,
    requested?: string,
  ): string | null {
    if (actor.role === UserRole.ADMIN) {
      return requested ?? null;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('You are not assigned to a branch');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return actor.branchId;
  }

  private assertBranchAccess(actor: AuthUser, account: CreditAccount): void {
    if (actor.role !== UserRole.ADMIN && account.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'You do not have access to this credit account',
      );
    }
  }

  private async notifyManagers(
    branchId: string,
    payload: NotifyPayload,
  ): Promise<void> {
    const recipients = await this.users.findManagersAndAdminsForBranches([
      branchId,
    ]);
    await Promise.all(
      recipients.map((user) => this.notifyUser(user.id, payload)),
    );
  }

  private async notifyUser(
    userId: string,
    payload: NotifyPayload,
  ): Promise<void> {
    // Best-effort: a notification failure must never roll back or 5xx an
    // already-committed account transition (same policy as stock-transfers).
    try {
      await this.notificationsService.create({
        userId,
        title: payload.title,
        message: payload.message,
        type: NotificationType.CREDIT_ACCOUNT,
        metadata: payload.metadata,
      });
      this.notificationsGateway.sendToUser(userId, {
        userId,
        title: payload.title,
        message: payload.message,
        type: NotificationType.CREDIT_ACCOUNT,
      });
    } catch (err) {
      this.logger.warn(
        `Failed to send credit-account notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
