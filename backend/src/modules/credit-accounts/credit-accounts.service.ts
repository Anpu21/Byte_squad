import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreditAccount } from '@/modules/credit-accounts/entities/credit-account.entity';
import { CreditAccountsRepository } from '@/modules/credit-accounts/credit-accounts.repository';
import { CreateCreditAccountRequestDto } from '@/modules/credit-accounts/dto/create-credit-account-request.dto';
import { ApproveCreditAccountDto } from '@/modules/credit-accounts/dto/approve-credit-account.dto';
import { RejectCreditAccountDto } from '@/modules/credit-accounts/dto/reject-credit-account.dto';
import { UpdateCreditAccountDto } from '@/modules/credit-accounts/dto/update-credit-account.dto';
import { ListCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/list-credit-accounts-query.dto';
import { SearchCreditAccountsQueryDto } from '@/modules/credit-accounts/dto/search-credit-accounts-query.dto';
import type { CreditAccountSearchResult } from '@/modules/credit-accounts/types';
import { CreditAccountStatus } from '@common/enums/credit-account-status.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';
import { UsersService } from '@users/users.service';
import type { AuthUser } from '@common/types/auth-user.type';

const round2 = (n: number): number => Math.round(n * 100) / 100;

interface NotifyPayload {
  title: string;
  message: string;
  metadata: Record<string, unknown>;
}

/**
 * Customer store-credit ("khata") accounts: the enrollment → approval
 * lifecycle and the POS picker search. Repayments + ageing live in the
 * Phase-3 additions; POS charge/override in Phase 4. Accounts are
 * branch-owned, so non-admins are scoped to their own branch throughout.
 */
@Injectable()
export class CreditAccountsService {
  private readonly logger = new Logger(CreditAccountsService.name);

  constructor(
    private readonly accounts: CreditAccountsRepository,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly users: UsersService,
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

  list(
    query: ListCreditAccountsQueryDto,
    actor: AuthUser,
  ): Promise<CreditAccount[]> {
    const branchId = this.resolveBranchScope(actor, query.branchId);
    return this.accounts.list({
      status: query.status,
      branchId,
      search: query.search?.trim() || undefined,
    });
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

  // ── Internals ──────────────────────────────────────────

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
