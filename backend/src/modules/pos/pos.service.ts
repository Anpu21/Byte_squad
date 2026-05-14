import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { Transaction } from '@pos/entities/transaction.entity.js';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto.js';
import { PosRepository } from '@pos/pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { Inventory } from '@inventory/entities/inventory.entity';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { TransactionType } from '@common/enums/transaction.enum';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// A line discount may be either a percentage of the line base (qty × unitPrice)
// or a fixed money amount; treating the percentage value as money produces
// totals that are right at qty=1 by coincidence and wrong everywhere else.
function computeLineTotal(
  unitPrice: number,
  quantity: number,
  discountAmount: number,
  discountType: DiscountType,
): number {
  const base = unitPrice * quantity;
  if (discountAmount <= 0) return round2(base);
  const off =
    discountType === DiscountType.PERCENTAGE
      ? base * (discountAmount / 100)
      : discountAmount;
  return round2(Math.max(0, base - off));
}
import {
  DailyBreakdown,
  TopProduct,
  AdminDashboardData,
  CashierDashboardData,
  CashierPeriodStats,
  CashierTransactionRow,
  CashierTransactionsSummary,
} from '@pos/types';

// Re-export so existing consumers that imported these from '@pos/pos.service'
// keep working without a broad rename. New code should import from '@pos/types'.
export type {
  DailyBreakdown,
  TopProduct,
  AdminDashboardData,
  CashierDashboardData,
  CashierPeriodStats,
  CashierTransactionRow,
  CashierTransactionsSummary,
};

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly pos: PosRepository,
    private readonly accounting: AccountingRepository,
    private readonly dataSource: DataSource,
  ) {}

  async createTransaction(
    dto: CreateTransactionDto,
    cashierId: string,
    branchId: string,
    idempotencyKey?: string,
  ): Promise<Transaction> {
    const trimmedKey = idempotencyKey?.trim();
    if (trimmedKey) {
      const existing = await this.pos.findIdempotencyKey(cashierId, trimmedKey);
      if (existing) {
        this.logger.log(
          `Idempotency replay: cashier=${cashierId} key=${trimmedKey} → txn=${existing.transactionId}`,
        );
        const replay = await this.findById(existing.transactionId);
        if (!replay) {
          throw new NotFoundException('Original transaction no longer exists');
        }
        return replay;
      }
    }

    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const items = dto.items.map((item) => {
      const discountAmount = item.discountAmount ?? 0;
      const discountType = item.discountType ?? DiscountType.NONE;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        discountType,
        lineTotal: computeLineTotal(
          item.unitPrice,
          item.quantity,
          discountAmount,
          discountType,
        ),
      };
    });

    const subtotal = round2(
      items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0),
    );
    const afterLineDiscounts = round2(
      items.reduce((sum, it) => sum + it.lineTotal, 0),
    );

    const cartDiscountAmount = dto.discountAmount ?? 0;
    const cartDiscountType = dto.discountType ?? DiscountType.NONE;
    const cartDiscountValue =
      cartDiscountAmount > 0
        ? cartDiscountType === DiscountType.PERCENTAGE
          ? round2(afterLineDiscounts * (cartDiscountAmount / 100))
          : round2(cartDiscountAmount)
        : 0;

    const total = round2(Math.max(0, afterLineDiscounts - cartDiscountValue));

    const saved = await this.dataSource.transaction(async (manager) => {
      if (dto.type === TransactionType.SALE) {
        const inventoryRepo = manager.getRepository(Inventory);
        for (const item of items) {
          const inv = await inventoryRepo
            .createQueryBuilder('inv')
            .setLock('pessimistic_write')
            .where('inv.product_id = :productId', { productId: item.productId })
            .andWhere('inv.branch_id = :branchId', { branchId })
            .getOne();

          if (!inv) {
            throw new ConflictException(
              `Product ${item.productId} is not stocked at this branch`,
            );
          }
          if (inv.quantity < item.quantity) {
            throw new ConflictException(
              `Insufficient stock for product ${item.productId}: only ${inv.quantity} available (requested ${item.quantity})`,
            );
          }
          inv.quantity -= item.quantity;
          await inventoryRepo.save(inv);
        }
      }

      const txnRepo = manager.getRepository(Transaction);
      const itemRepo = manager.getRepository(TransactionItem);
      const txn = await txnRepo.save(
        txnRepo.create({
          transactionNumber,
          branchId,
          cashierId,
          type: dto.type,
          subtotal,
          discountAmount: cartDiscountAmount,
          discountType: cartDiscountType,
          taxAmount: 0,
          total,
          paymentMethod: dto.paymentMethod,
        }),
      );
      await itemRepo.save(
        items.map((it) => itemRepo.create({ ...it, transactionId: txn.id })),
      );

      if (Number(txn.total) > 0) {
        await this.accounting.createLedgerEntryWithManager(manager, {
          branchId: txn.branchId,
          entryType: LedgerEntryType.CREDIT,
          amount: txn.total,
          description: `POS Sale — ${txn.transactionNumber}`,
          referenceNumber: txn.transactionNumber,
          transactionId: txn.id,
        });
      }

      return txn;
    });

    if (trimmedKey) {
      try {
        await this.pos.insertIdempotencyKey({
          key: trimmedKey,
          cashierId,
          transactionId: saved.id,
        });
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const winning = await this.pos.findIdempotencyKey(
            cashierId,
            trimmedKey,
          );
          if (winning && winning.transactionId !== saved.id) {
            this.logger.warn(
              `Idempotency race: cashier=${cashierId} key=${trimmedKey} kept=${winning.transactionId} discarded=${saved.id}`,
            );
            const replay = await this.findById(winning.transactionId);
            if (replay) return replay;
          }
        }
        throw err;
      }
    }

    return saved;
  }

  async findAll(branchId: string): Promise<Transaction[]> {
    return this.pos.findTransactionsByBranch(branchId);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.pos.findTransactionById(id);
  }

  async getCashierDashboard(
    cashierId: string,
    branchId: string,
  ): Promise<CashierDashboardData> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const todayTransactions = await this.pos.findTransactionsForCashierSince(
      cashierId,
      branchId,
      todayStart,
    );
    const todayTotalSales = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const todayCount = todayTransactions.length;
    const todayAvg = todayCount > 0 ? todayTotalSales / todayCount : 0;

    const weekTransactions = await this.pos.findTransactionsForCashierSince(
      cashierId,
      branchId,
      weekStart,
    );
    const weekTotalSales = weekTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );

    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().split('T')[0], { totalSales: 0, count: 0 });
    }
    for (const t of weekTransactions) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }

    const dailyBreakdown: DailyBreakdown[] = Array.from(
      dailyMap,
      ([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      }),
    );

    const recentTransactions = await this.pos.findRecentForCashier(
      cashierId,
      branchId,
      10,
    );

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

    const todayTxns = await this.pos.findTransactionsSince(todayStart);
    const todaySales = todayTxns.reduce((s, t) => s + Number(t.total), 0);
    const todayCount = todayTxns.length;
    const todayAvg = todayCount > 0 ? todaySales / todayCount : 0;

    const weekTxns = await this.pos.findTransactionsSince(weekStart);
    const weekSales = weekTxns.reduce((s, t) => s + Number(t.total), 0);

    const monthTxns = await this.pos.findTransactionsSince(monthStart);
    const monthRevenue = monthTxns.reduce((s, t) => s + Number(t.total), 0);

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
    const dailyBreakdown: DailyBreakdown[] = Array.from(
      dailyMap,
      ([date, data]) => ({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      }),
    );

    const topProductsRaw = await this.pos.topProductsSince(monthStart, 5);
    const topProducts: TopProduct[] = topProductsRaw.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalQuantity: r.totalQuantity,
      totalRevenue: Math.round(r.totalRevenue * 100) / 100,
    }));

    const recentTransactions = await this.pos.findRecent(10);

    const [activeProducts, lowStockItems, totalUsers, totalBranches] =
      await Promise.all([
        this.pos.countActiveProducts(),
        this.pos.countLowStockItems(),
        this.pos.countAllUsers(),
        this.pos.countActiveBranches(),
      ]);

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

    const [todayAgg, monthAgg, yearAgg, recentTxns] = await Promise.all([
      this.pos.periodAggregateForBranch(branchId, todayStart, cashierId),
      this.pos.periodAggregateForBranch(branchId, monthStart, cashierId),
      this.pos.periodAggregateForBranch(branchId, yearStart, cashierId),
      this.pos.findRecentScopedTransactions(
        cashierId ? { cashierId, branchId } : { branchId },
      ),
    ]);

    const toStats = (agg: { total: number; count: number }) => ({
      totalSales: Math.round(agg.total * 100) / 100,
      transactionCount: agg.count,
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

  async getAllTransactionsSummary(): Promise<CashierTransactionsSummary> {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [todayAgg, monthAgg, yearAgg, recentTxns] = await Promise.all([
      this.pos.periodAggregateSystem(todayStart),
      this.pos.periodAggregateSystem(monthStart),
      this.pos.periodAggregateSystem(yearStart),
      this.pos.findRecentWithBranch(200),
    ]);

    const toStats = (agg: { total: number; count: number }) => ({
      totalSales: Math.round(agg.total * 100) / 100,
      transactionCount: agg.count,
    });

    return {
      scope: 'system',
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
        branchName: t.branch?.name ?? null,
        createdAt: t.createdAt,
      })),
    };
  }
}
