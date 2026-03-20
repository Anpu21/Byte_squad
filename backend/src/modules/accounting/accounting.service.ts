import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { CreateExpenseDto } from '@accounting/dto/create-expense.dto';

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

  async getLedgerEntries(branchId: string): Promise<LedgerEntry[]> {
    return this.ledgerRepository.find({
      where: { branchId },
      order: { createdAt: 'DESC' },
    });
  }

  async createExpense(
    dto: CreateExpenseDto,
    createdBy: string,
  ): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...dto,
      createdBy,
    });
    return this.expenseRepository.save(expense);
  }

  async deleteExpense(id: string): Promise<void> {
    await this.expenseRepository.delete(id);
  }

  async getExpenses(branchId: string): Promise<Expense[]> {
    return this.expenseRepository.find({
      where: { branchId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
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
