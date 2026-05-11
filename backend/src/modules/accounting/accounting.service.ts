import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { Expense } from '@accounting/entities/expense.entity';
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

export interface GetExpensesOptions {
  branchId?: string;
  status?: ExpenseStatus;
  search?: string;
}

export interface PaginatedLedger {
  items: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LedgerSummary {
  totalCredits: number;
  totalDebits: number;
  netBalance: number;
  entryCount: number;
}

export interface ProfitLossData {
  period: { startDate: string; endDate: string };
  revenue: {
    totalSales: number;
    totalTransactions: number;
    totalDiscounts: number;
    totalTax: number;
    netRevenue: number;
  };
  costOfGoodsSold: {
    totalCOGS: number;
    itemsSold: number;
  };
  grossProfit: number;
  grossMargin: number;
  expenses: {
    total: number;
    byCategory: { category: string; amount: number }[];
  };
  netProfit: number;
  netMargin: number;
}

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
  ) {}

  async getLedgerEntries(
    branchId: string,
    options?: {
      entryType?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedLedger> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;

    const qb = this.ledgerRepository
      .createQueryBuilder('le')
      .where('le.branch_id = :branchId', { branchId });

    if (options?.entryType && options.entryType !== 'all') {
      qb.andWhere('le.entry_type = :entryType', {
        entryType: options.entryType,
      });
    }

    if (options?.startDate) {
      const start = new Date(options.startDate);
      start.setHours(0, 0, 0, 0);
      qb.andWhere('le.created_at >= :start', { start });
    }

    if (options?.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('le.created_at <= :end', { end });
    }

    if (options?.search) {
      qb.andWhere(
        '(le.description ILIKE :search OR le.reference_number ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    qb.orderBy('le.created_at', 'DESC');

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLedgerSummary(branchId: string): Promise<LedgerSummary> {
    const result = await this.ledgerRepository
      .createQueryBuilder('le')
      .select(
        `SUM(CASE WHEN le.entry_type = 'credit' THEN le.amount ELSE 0 END)`,
        'totalCredits',
      )
      .addSelect(
        `SUM(CASE WHEN le.entry_type = 'debit' THEN le.amount ELSE 0 END)`,
        'totalDebits',
      )
      .addSelect('COUNT(*)', 'entryCount')
      .where('le.branch_id = :branchId', { branchId })
      .getRawOne<{
        totalCredits: string | null;
        totalDebits: string | null;
        entryCount: string;
      }>();

    const totalCredits = Number(result?.totalCredits ?? 0);
    const totalDebits = Number(result?.totalDebits ?? 0);

    return {
      totalCredits: Math.round(totalCredits * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      netBalance: Math.round((totalCredits - totalDebits) * 100) / 100,
      entryCount: Number(result?.entryCount ?? 0),
    };
  }

  async createExpense(
    dto: CreateExpenseDto,
    user: RequestUser,
  ): Promise<Expense> {
    // Managers can only add expenses to their own branch.
    // Admins may pick any branch via dto.branchId; fall back to their own.
    let branchId: string | null;
    if (user.role === UserRole.MANAGER) {
      branchId = user.branchId;
    } else {
      branchId = dto.branchId ?? user.branchId;
    }
    if (!branchId) {
      throw new ForbiddenException('No branch context available');
    }

    const expense = this.expenseRepository.create({
      ...dto,
      branchId,
      createdBy: user.id,
      status: ExpenseStatus.PENDING,
    });
    const saved = await this.expenseRepository.save(expense);

    // Create a DEBIT ledger entry for this expense
    const ledgerEntry = this.ledgerRepository.create({
      branchId: saved.branchId,
      entryType: LedgerEntryType.DEBIT,
      amount: saved.amount,
      description: `Expense: ${saved.category} — ${saved.description}`,
      referenceNumber: `EXP-${saved.id.substring(0, 8).toUpperCase()}`,
    });
    await this.ledgerRepository.save(ledgerEntry);

    return saved;
  }

  async deleteExpense(id: string, user: RequestUser): Promise<void> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
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

    // Also delete any associated ledger entry
    const refPrefix = `EXP-${id.substring(0, 8).toUpperCase()}`;
    await this.ledgerRepository.delete({ referenceNumber: refPrefix });
    await this.expenseRepository.delete(id);
  }

  async getExpenses(opts: GetExpensesOptions = {}): Promise<Expense[]> {
    const qb = this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.creator', 'creator')
      .leftJoinAndSelect('expense.reviewer', 'reviewer')
      .leftJoinAndSelect('expense.branch', 'branch')
      .orderBy('expense.created_at', 'DESC');

    if (opts.branchId) {
      qb.andWhere('expense.branch_id = :branchId', { branchId: opts.branchId });
    }

    if (opts.status) {
      qb.andWhere('expense.status = :status', { status: opts.status });
    }

    if (opts.search) {
      qb.andWhere(
        '(expense.description ILIKE :search OR expense.category ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }

    return qb.getMany();
  }

  async reviewExpense(
    id: string,
    dto: ReviewExpenseDto,
    reviewerId: string,
  ): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({ where: { id } });
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

    return this.expenseRepository.save(expense);
  }

  async getProfitLoss(
    branchId: string,
    startDate: string,
    endDate: string,
  ): Promise<ProfitLossData> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Revenue: sum of all transactions in the period
    const transactions = await this.transactionRepository.find({
      where: {
        branchId,
        createdAt: Between(start, end),
      },
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
    const cogsResult = await this.transactionItemRepository
      .createQueryBuilder('ti')
      .select('SUM(p.cost_price * ti.quantity)', 'totalCOGS')
      .addSelect('SUM(ti.quantity)', 'itemsSold')
      .innerJoin('ti.transaction', 't')
      .innerJoin('ti.product', 'p')
      .where('t.branch_id = :branchId', { branchId })
      .andWhere('t.created_at BETWEEN :start AND :end', { start, end })
      .getRawOne<{ totalCOGS: string | null; itemsSold: string | null }>();

    const totalCOGS = Number(cogsResult?.totalCOGS ?? 0);
    const itemsSold = Number(cogsResult?.itemsSold ?? 0);

    // Gross profit
    const grossProfit = netRevenue - totalCOGS;
    const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    // Expenses in the period
    const expenses = await this.expenseRepository.find({
      where: {
        branchId,
        expenseDate: Between(start, end),
      },
    });

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

    // Net profit
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
