import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Transaction } from '@pos/entities/transaction.entity.js';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto.js';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { TransactionType } from '@common/enums/transaction.enum';

export interface DailyBreakdown {
  date: string;
  totalSales: number;
  transactionCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface AdminDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  month: {
    totalRevenue: number;
    transactionCount: number;
  };
  stats: {
    activeProducts: number;
    lowStockItems: number;
    totalUsers: number;
    totalBranches: number;
  };
  dailyBreakdown: DailyBreakdown[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
}

export interface CashierDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  dailyBreakdown: DailyBreakdown[];
  recentTransactions: Transaction[];
}

export interface CashierPeriodStats {
  totalSales: number;
  transactionCount: number;
}

export interface CashierTransactionRow {
  id: string;
  transactionNumber: string;
  total: number;
  itemCount: number;
  cashierName: string;
  createdAt: Date;
}

export interface CashierTransactionsSummary {
  scope: 'cashier' | 'branch';
  today: CashierPeriodStats;
  month: CashierPeriodStats;
  year: CashierPeriodStats;
  recentTransactions: CashierTransactionRow[];
}

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
  ) {}

  async createTransaction(
    dto: CreateTransactionDto,
    cashierId: string,
    branchId: string,
  ): Promise<Transaction> {
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = this.transactionRepository.create({
      transactionNumber,
      branchId,
      cashierId,
      type: dto.type,
      subtotal: 0,
      discountAmount: dto.discountAmount ?? 0,
      discountType: dto.discountType,
      taxAmount: 0,
      total: 0,
      paymentMethod: dto.paymentMethod,
      items: dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
        discountType: item.discountType,
        lineTotal: item.unitPrice * item.quantity - (item.discountAmount ?? 0),
      })),
    });

    const saved = await this.transactionRepository.save(transaction);

    // Create a CREDIT ledger entry for this sale
    if (Number(saved.total) > 0) {
      const ledgerEntry = this.ledgerRepository.create({
        branchId: saved.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: saved.total,
        description: `POS Sale — ${saved.transactionNumber}`,
        referenceNumber: saved.transactionNumber,
        transactionId: saved.id,
      });
      await this.ledgerRepository.save(ledgerEntry);
    }

    return saved;
  }

  async findAll(branchId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { branchId },
      relations: ['items', 'items.product', 'cashier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'cashier'],
    });
  }

  async getCashierDashboard(
    cashierId: string,
    branchId: string,
  ): Promise<CashierDashboardData> {
    const now = new Date();

    // Start of today (midnight)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Start of 7 days ago
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // Today's transactions for this cashier
    const todayTransactions = await this.transactionRepository.find({
      where: {
        cashierId,
        branchId,
        createdAt: MoreThanOrEqual(todayStart),
      },
    });

    const todayTotalSales = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const todayCount = todayTransactions.length;
    const todayAvg = todayCount > 0 ? todayTotalSales / todayCount : 0;

    // This week's transactions
    const weekTransactions = await this.transactionRepository.find({
      where: {
        cashierId,
        branchId,
        createdAt: MoreThanOrEqual(weekStart),
      },
    });

    const weekTotalSales = weekTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );

    // Daily breakdown for chart (last 7 days)
    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { totalSales: 0, count: 0 });
    }

    for (const t of weekTransactions) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }

    const dailyBreakdown: DailyBreakdown[] = [];
    for (const [date, data] of dailyMap) {
      dailyBreakdown.push({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      });
    }

    // Recent 10 transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { cashierId, branchId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      today: {
        totalSales: Math.round(todayTotalSales * 100) / 100,
        transactionCount: todayCount,
        averageSale: Math.round(todayAvg * 100) / 100,
      },
      week: {
        totalSales: Math.round(weekTotalSales * 100) / 100,
        transactionCount: weekTransactions.length,
      },
      dailyBreakdown,
      recentTransactions,
    };
  }

  async getAdminDashboard(): Promise<AdminDashboardData> {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's sales (all branches)
    const todayTxns = await this.transactionRepository.find({
      where: { createdAt: MoreThanOrEqual(todayStart) },
    });
    const todaySales = todayTxns.reduce((s, t) => s + Number(t.total), 0);
    const todayCount = todayTxns.length;
    const todayAvg = todayCount > 0 ? todaySales / todayCount : 0;

    // This week
    const weekTxns = await this.transactionRepository.find({
      where: { createdAt: MoreThanOrEqual(weekStart) },
    });
    const weekSales = weekTxns.reduce((s, t) => s + Number(t.total), 0);

    // This month
    const monthTxns = await this.transactionRepository.find({
      where: { createdAt: MoreThanOrEqual(monthStart) },
    });
    const monthRevenue = monthTxns.reduce((s, t) => s + Number(t.total), 0);

    // Daily breakdown (last 7 days)
    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split('T')[0], { totalSales: 0, count: 0 });
    }
    for (const t of weekTxns) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }
    const dailyBreakdown: DailyBreakdown[] = [];
    for (const [date, data] of dailyMap) {
      dailyBreakdown.push({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      });
    }

    // Top selling products (from transaction items in last 30 days)
    const topProductsRaw = await this.transactionItemRepository
      .createQueryBuilder('ti')
      .select('ti.product_id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('SUM(ti.quantity)', 'totalQuantity')
      .addSelect('SUM(ti.line_total)', 'totalRevenue')
      .innerJoin('ti.product', 'p')
      .innerJoin('ti.transaction', 't')
      .where('t.created_at >= :monthStart', { monthStart })
      .groupBy('ti.product_id')
      .addGroupBy('p.name')
      .orderBy('SUM(ti.line_total)', 'DESC')
      .limit(5)
      .getRawMany<{
        productId: string;
        productName: string;
        totalQuantity: string;
        totalRevenue: string;
      }>();

    const topProducts: TopProduct[] = topProductsRaw.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Math.round(Number(r.totalRevenue) * 100) / 100,
    }));

    // Recent transactions (all branches)
    const recentTransactions = await this.transactionRepository.find({
      relations: ['items', 'cashier'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // Counts — use raw queries for efficiency
    const activeProducts = await this.transactionItemRepository.manager
      .query<
        { count: string }[]
      >(`SELECT COUNT(*) as count FROM products WHERE is_active = true`)
      .then((r: { count: string }[]) => Number(r[0].count));

    const lowStockItems = await this.transactionItemRepository.manager
      .query<
        { count: string }[]
      >(`SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_threshold`)
      .then((r: { count: string }[]) => Number(r[0].count));

    const totalUsers = await this.transactionItemRepository.manager
      .query<{ count: string }[]>(`SELECT COUNT(*) as count FROM users`)
      .then((r: { count: string }[]) => Number(r[0].count));

    const totalBranches = await this.transactionItemRepository.manager
      .query<
        { count: string }[]
      >(`SELECT COUNT(*) as count FROM branches WHERE is_active = true`)
      .then((r: { count: string }[]) => Number(r[0].count));

    return {
      today: {
        totalSales: Math.round(todaySales * 100) / 100,
        transactionCount: todayCount,
        averageSale: Math.round(todayAvg * 100) / 100,
      },
      week: {
        totalSales: Math.round(weekSales * 100) / 100,
        transactionCount: weekTxns.length,
      },
      month: {
        totalRevenue: Math.round(monthRevenue * 100) / 100,
        transactionCount: monthTxns.length,
      },
      stats: {
        activeProducts,
        lowStockItems,
        totalUsers,
        totalBranches,
      },
      dailyBreakdown,
      topProducts,
      recentTransactions,
    };
  }

  async getTransactionsSummary(
    branchId: string,
    cashierId: string | null,
  ): Promise<CashierTransactionsSummary> {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const yearStart = new Date(now.getFullYear(), 0, 1);

    const periodAgg = (start: Date) => {
      const qb = this.transactionRepository
        .createQueryBuilder('txn')
        .select('COALESCE(SUM(txn.total), 0)', 'total')
        .addSelect('COUNT(txn.id)', 'count')
        .where('txn.branch_id = :branchId', { branchId })
        .andWhere('txn.type = :type', { type: TransactionType.SALE })
        .andWhere('txn.created_at >= :start', { start });

      if (cashierId) {
        qb.andWhere('txn.cashier_id = :cashierId', { cashierId });
      }

      return qb.getRawOne<{ total: string; count: string }>();
    };

    const recentWhere = cashierId ? { cashierId, branchId } : { branchId };

    const [todayAgg, monthAgg, yearAgg, recentTxns] = await Promise.all([
      periodAgg(todayStart),
      periodAgg(monthStart),
      periodAgg(yearStart),
      this.transactionRepository.find({
        where: recentWhere,
        relations: ['items', 'cashier'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    const toStats = (agg: { total: string; count: string } | undefined) => ({
      totalSales: Math.round(Number(agg?.total ?? 0) * 100) / 100,
      transactionCount: Number(agg?.count ?? 0),
    });

    return {
      scope: cashierId ? 'cashier' : 'branch',
      today: toStats(todayAgg),
      month: toStats(monthAgg),
      year: toStats(yearAgg),
      recentTransactions: recentTxns.map((t) => ({
        id: t.id,
        transactionNumber: t.transactionNumber,
        total: Number(t.total),
        itemCount: t.items?.length ?? 0,
        cashierName: t.cashier
          ? `${t.cashier.firstName} ${t.cashier.lastName}`
          : 'Unknown',
        createdAt: t.createdAt,
      })),
    };
  }
}
