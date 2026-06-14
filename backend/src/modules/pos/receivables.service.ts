import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '@common/enums/user-roles.enums';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { User } from '@users/entities/user.entity';
import { Sale } from '@pos/entities/sale.entity';
import { AccountingService } from '@accounting/accounting.service';
import { ACCOUNT_CODES } from '@accounting/types/account-code.type';
import { CreditTransaction } from '@pos/entities/credit-transaction.entity';
import { CreditTransactionRepository } from '@pos/credit-transaction.repository';
import { ReceiveCreditPaymentDto } from '@pos/dto/receive-credit-payment.dto';
import type { ReceivableRow } from '@pos/types/receivable-row.type';

export interface ReceivablesActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface CreditStatement {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  currentBalance: number;
  creditLimit: number | null;
  transactions: CreditTransaction[];
}

interface ReceivableRaw {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  current_balance: string;
  credit_limit: string | null;
  b0to30: string;
  b31to60: string;
  b61to90: string;
  b90plus: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Customer receivables (AR) — the mirror of supplier payables. Customers
 * are global, so the report spans branches; the repayment voucher itself
 * is branch-stamped for the ledger. Repayments settle unpaid credit
 * sales FIFO (oldest first) so the ageing buckets stay truthful, and any
 * excess simply drives `currentBalance` negative — store credit, same
 * semantics as checkout's `keepBalance`.
 */
@Injectable()
export class ReceivablesService {
  constructor(
    private readonly creditTransactions: CreditTransactionRepository,
    private readonly accounting: AccountingService,
    private readonly dataSource: DataSource,
  ) {}

  async list(): Promise<ReceivableRow[]> {
    const raw: ReceivableRaw[] = await this.dataSource.query(`
      SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        u.phone,
        u.current_balance,
        u.credit_limit,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - s.created_at::date <= 30
          THEN s.balance_due ELSE 0 END), 0) AS b0to30,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - s.created_at::date BETWEEN 31 AND 60
          THEN s.balance_due ELSE 0 END), 0) AS b31to60,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - s.created_at::date BETWEEN 61 AND 90
          THEN s.balance_due ELSE 0 END), 0) AS b61to90,
        COALESCE(SUM(CASE WHEN CURRENT_DATE - s.created_at::date > 90
          THEN s.balance_due ELSE 0 END), 0) AS b90plus
      FROM users u
      LEFT JOIN sales s
        ON s.customer_user_id = u.id
       AND s.status = 'Active'
       AND s.balance_due > 0
      WHERE u.current_balance <> 0
         OR EXISTS (
              SELECT 1 FROM sales s2
              WHERE s2.customer_user_id = u.id
                AND s2.status = 'Active'
                AND s2.balance_due > 0
            )
      GROUP BY u.id, u.first_name, u.last_name, u.phone,
               u.current_balance, u.credit_limit
      ORDER BY u.current_balance DESC
    `);

    return raw.map((r) => {
      const b0to30 = Number(r.b0to30);
      const b31to60 = Number(r.b31to60);
      const b61to90 = Number(r.b61to90);
      const b90plus = Number(r.b90plus);
      return {
        userId: r.user_id,
        firstName: r.first_name,
        lastName: r.last_name,
        phone: r.phone,
        currentBalance: Number(r.current_balance),
        creditLimit: r.credit_limit === null ? null : Number(r.credit_limit),
        b0to30,
        b31to60,
        b61to90,
        b90plus,
        unpaidTotal: round2(b0to30 + b31to60 + b61to90 + b90plus),
      };
    });
  }

  async getStatement(userId: string): Promise<CreditStatement> {
    const user = await this.dataSource
      .getRepository(User)
      .findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Customer not found');
    const transactions = await this.creditTransactions.findByUserId(userId);
    return {
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      currentBalance: Number(user.currentBalance),
      creditLimit: user.creditLimit === null ? null : Number(user.creditLimit),
      transactions,
    };
  }

  /**
   * Record a repayment: Credit_Paid entry + balance update + FIFO
   * settlement of unpaid credit sales + a CREDIT ledger posting, all in
   * one transaction with the customer row locked.
   */
  async receivePayment(
    userId: string,
    dto: ReceiveCreditPaymentDto,
    actor: ReceivablesActor,
  ): Promise<CreditStatement> {
    const branchId = this.resolveBranch(dto.branchId, actor);
    const amount = round2(dto.amount);

    await this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :userId', { userId })
        .getOne();
      if (!user) throw new NotFoundException('Customer not found');

      const newBalance = round2(Number(user.currentBalance) - amount);
      const referenceNo = `CRPAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

      await this.creditTransactions.create(
        {
          userId,
          saleId: null,
          transactionType: 'Credit_Paid',
          amount,
          runningBalance: newBalance,
          referenceNo,
          notes: dto.notes ?? `Credit payment received via ${dto.method}`,
        },
        manager,
      );
      await manager
        .getRepository(User)
        .update(userId, { currentBalance: newBalance });

      // FIFO settle unpaid credit sales so ageing stays truthful.
      const unpaidSales = await manager
        .getRepository(Sale)
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.customer_user_id = :userId', { userId })
        .andWhere(`s.status = 'Active'`)
        .andWhere('s.balance_due > 0')
        .orderBy('s.created_at', 'ASC')
        .getMany();
      let remaining = amount;
      for (const sale of unpaidSales) {
        if (remaining <= 0) break;
        const due = Number(sale.balanceDue);
        const applied = Math.min(due, remaining);
        remaining = round2(remaining - applied);
        const newDue = round2(due - applied);
        await manager.getRepository(Sale).update(sale.id, {
          balanceDue: newDue,
          paymentStatus: newDue <= 0 ? 'Paid' : 'Partially_Paid',
        });
      }

      await this.accounting.createLedgerEntryWithManager(manager, {
        branchId,
        entryType: LedgerEntryType.CREDIT,
        amount,
        description: `Credit payment from ${user.firstName} ${user.lastName} (${dto.method})`,
        referenceNumber: referenceNo,
        accountCode:
          dto.method === 'Cash' ? ACCOUNT_CODES.CASH : ACCOUNT_CODES.BANK,
      });
    });

    return this.getStatement(userId);
  }

  async setCreditLimit(
    userId: string,
    creditLimit: number | null,
  ): Promise<CreditStatement> {
    const repo = this.dataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Customer not found');
    await repo.update(userId, {
      creditLimit: creditLimit === null ? null : round2(creditLimit),
    });
    return this.getStatement(userId);
  }

  private resolveBranch(
    requested: string | undefined,
    actor: ReceivablesActor,
  ): string {
    if (actor.role === UserRole.ADMIN) {
      if (!requested) {
        throw new BadRequestException(
          'branchId is required when receiving payments as an admin',
        );
      }
      return requested;
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch linked to your account');
    }
    if (requested && requested !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot receive payments for another branch',
      );
    }
    return actor.branchId;
  }
}
