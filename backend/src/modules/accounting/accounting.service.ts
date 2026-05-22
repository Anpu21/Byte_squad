import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { Expense } from '@accounting/entities/expense.entity';
import { AccountingRepository } from '@accounting/accounting.repository';
// TODO Phase C8 — replace these cross-module borrowings with PosRepository /
// TransactionItemsRepository once POS migrates.
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';
import { ReviewExpenseDto } from '@accounting/dto/review-expense.dto';
import { ExpenseStatus } from '@common/enums/expense-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

interface RequestUser {
  id: string;
  role: UserRole;
  branchId: string | null;
}

import {
  GetExpensesOptions,
  PaginatedLedger,
  LedgerSummary,
  ProfitLossData,
} from '@accounting/types';

// Re-export so existing callers that imported these from this file keep working.
export type {
  GetExpensesOptions,
  PaginatedLedger,
  LedgerSummary,
  ProfitLossData,
};

@Injectable()
export class AccountingService {
  constructor(
    private readonly accounting: AccountingRepository,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
  ) {}

  async getLedgerEntries(
    branchId: string | null,
    options?: {
      entryType?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedLedger> {
    return this.accounting.listLedger({
      branchId,
      entryType: options?.entryType,
      startDate: options?.startDate,
      endDate: options?.endDate,
      search: options?.search,
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    });
  }

  async getLedgerSummary(branchId: string | null): Promise<LedgerSummary> {
    const result = await this.accounting.getLedgerSummary(branchId);
    return {
      totalCredits: Math.round(result.totalCredits * 100) / 100,
      totalDebits: Math.round(result.totalDebits * 100) / 100,
      netBalance:
        Math.round((result.totalCredits - result.totalDebits) * 100) / 100,
      entryCount: result.entryCount,
    };
  }

  async createExpense(
    dto: CreateExpenseDto,
    user: RequestUser,
  ): Promise<Expense> {
    // Managers can only add expenses to their own branch; the dto.branchId
    // is ignored. Admins are not tied to a branch, so they MUST pass
    // dto.branchId to say which branch the expense is for.
    let branchId: string;
    if (user.role === UserRole.MANAGER) {
      if (!user.branchId) {
        throw new ForbiddenException('Manager is not assigned to a branch');
      }
      branchId = user.branchId;
    } else {
      if (!dto.branchId) {
        throw new BadRequestException(
          'branchId is required when an admin creates an expense',
        );
      }
      branchId = dto.branchId;
    }

    const saved = await this.accounting.createExpense({
      ...dto,
      branchId,
      createdBy: user.id,
      status: ExpenseStatus.PENDING,
    });

    await this.accounting.createLedgerEntry({
      branchId: saved.branchId,
      entryType: LedgerEntryType.DEBIT,
      amount: saved.amount,
      description: `Expense: ${saved.category} — ${saved.description}`,
      referenceNumber: `EXP-${saved.id.substring(0, 8).toUpperCase()}`,
    });

    return saved;
  }

  async deleteExpense(id: string, user: RequestUser): Promise<void> {
    const expense = await this.accounting.findExpenseById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    if (user.role === UserRole.MANAGER) {
      if (expense.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Cannot delete expenses from another branch',
        );
      }
      if (expense.status !== ExpenseStatus.PENDING) {
        throw new ForbiddenException('Only pending expenses can be deleted');
      }
    }

    const refPrefix = `EXP-${id.substring(0, 8).toUpperCase()}`;
    await this.accounting.deleteLedgerByReference(refPrefix);
    await this.accounting.deleteExpense(id);
  }

  async getExpenses(opts: GetExpensesOptions = {}): Promise<Expense[]> {
    return this.accounting.listExpenses({
      branchId: opts.branchId,
      status: opts.status,
      search: opts.search,
    });
  }

  async reviewExpense(
    id: string,
    dto: ReviewExpenseDto,
    reviewerId: string,
  ): Promise<Expense> {
    const expense = await this.accounting.findExpenseById(id);
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    if (expense.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException(
        `Expense is already ${expense.status} and cannot be reviewed again`,
      );
    }

    expense.status = dto.status;
    expense.reviewedBy = reviewerId;
    expense.reviewedAt = new Date();
    expense.reviewNote = dto.note ?? null;

    return this.accounting.saveExpense(expense);
  }

  async getProfitLoss(
    branchId: string | null,
    startDate: string,
    endDate: string,
  ): Promise<ProfitLossData> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Revenue: sum of all transactions in the period.
    // branchId === null means "across all branches" (admin cross-branch view).
    const transactions = await this.transactionRepository.find({
      where:
        branchId !== null
          ? { branchId, createdAt: Between(start, end) }
          : { createdAt: Between(start, end) },
    });

    const totalSales = transactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const totalDiscounts = transactions.reduce(
      (sum, t) => sum + Number(t.discountAmount),
      0,
    );
    const totalTax = transactions.reduce(
      (sum, t) => sum + Number(t.taxAmount),
      0,
    );
    const netRevenue = totalSales;

    // COGS: sum of (costPrice × quantity) for all items sold
    const cogsQb = this.transactionItemRepository
      .createQueryBuilder('ti')
      .select('SUM(p.cost_price * ti.quantity)', 'totalCOGS')
      .addSelect('SUM(ti.quantity)', 'itemsSold')
      .innerJoin('ti.transaction', 't')
      .innerJoin('ti.product', 'p')
      .where('t.created_at BETWEEN :start AND :end', { start, end });
    if (branchId !== null) {
      cogsQb.andWhere('t.branch_id = :branchId', { branchId });
    }
    const cogsResult = await cogsQb.getRawOne<{
      totalCOGS: string | null;
      itemsSold: string | null;
    }>();

    const totalCOGS = Number(cogsResult?.totalCOGS ?? 0);
    const itemsSold = Number(cogsResult?.itemsSold ?? 0);

    // Gross profit
    const grossProfit = netRevenue - totalCOGS;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Expenses in the period
    const expenses = await this.accounting.findExpensesInRange(
      branchId,
      start,
      end,
    );

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );

    // Group expenses by category
    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      const current = categoryMap.get(e.category) ?? 0;
      categoryMap.set(e.category, current + Number(e.amount));
    }
    const byCategory = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.amount - a.amount);

    const netProfit = grossProfit - totalExpenses;
    const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue: {
        totalSales: Math.round(totalSales * 100) / 100,
        totalTransactions: transactions.length,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
      },
      costOfGoodsSold: {
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        itemsSold,
      },
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossMargin: Math.round(grossMargin * 100) / 100,
      expenses: {
        total: Math.round(totalExpenses * 100) / 100,
        byCategory,
      },
      netProfit: Math.round(netProfit * 100) / 100,
      netMargin: Math.round(netMargin * 100) / 100,
    };
  }
}
