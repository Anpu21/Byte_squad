import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, MoreThanOrEqual, Repository } from 'typeorm';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import type { InventorySummary } from '@pos/types';

export interface PeriodAggregate {
  total: number;
  count: number;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

@Injectable()
export class PosRepository {
  constructor(
    @InjectRepository(Sale)
    private readonly transactionRepo: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly transactionItemRepo: Repository<SaleItem>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async createAndSaveTransaction(partial: DeepPartial<Sale>): Promise<Sale> {
    return this.transactionRepo.save(this.transactionRepo.create(partial));
  }

  async findTransactionById(id: string): Promise<Sale | null> {
    return this.transactionRepo.findOne({
      where: { id },
      // `items.unit` is eager-loaded so the FE receipt template (Phase P4)
      // can render the picked sellable-unit suffix instead of falling back
      // to the bare base-unit label.
      relations: ['items', 'items.product', 'items.unit', 'cashier'],
    });
  }

  async findTransactionsByBranch(branchId: string): Promise<Sale[]> {
    return this.transactionRepo.find({
      where: { branchId },
      relations: ['items', 'items.product', 'cashier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findTransactionsForCashierSince(
    cashierId: string,
    branchId: string,
    since: Date,
  ): Promise<Sale[]> {
    return this.transactionRepo.find({
      where: { cashierId, branchId, createdAt: MoreThanOrEqual(since) },
    });
  }

  async findRecentForCashier(
    cashierId: string,
    branchId: string,
    take: number,
  ): Promise<Sale[]> {
    return this.transactionRepo.find({
      where: { cashierId, branchId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take,
    });
  }

  async findTransactionsSince(since: Date): Promise<Sale[]> {
    return this.transactionRepo.find({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }

  async findRecent(take: number): Promise<Sale[]> {
    return this.transactionRepo.find({
      relations: ['items', 'cashier'],
      order: { createdAt: 'DESC' },
      take,
    });
  }

  async findRecentWithBranch(take: number): Promise<Sale[]> {
    return this.transactionRepo.find({
      relations: ['items', 'cashier', 'branch'],
      order: { createdAt: 'DESC' },
      take,
    });
  }

  /**
   * Shanel-aligned recent-sales fetch backing `GET /pos/recent-sales`.
   * Eager-loads only the `customer` relation so the row mapper can populate
   * `customerName` without a follow-up query — the mapper reads no other
   * relations and the cashier UI polls this endpoint frequently. When
   * `branchId` is non-null we scope to a single branch (cashier/manager);
   * admins pass `null` to see system-wide activity.
   */
  async findRecentSales(
    branchId: string | null,
    take: number,
  ): Promise<Sale[]> {
    const opts = {
      relations: ['customer'],
      order: { createdAt: 'DESC' as const },
      take,
    };
    if (branchId) {
      return this.transactionRepo.find({ ...opts, where: { branchId } });
    }
    return this.transactionRepo.find(opts);
  }

  async periodAggregateForBranch(
    branchId: string,
    since: Date,
    cashierId: string | null,
  ): Promise<PeriodAggregate> {
    const qb = this.transactionRepo
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(txn.total), 0)', 'total')
      .addSelect('COUNT(txn.id)', 'count')
      .where('txn.branch_id = :branchId', { branchId })
      .andWhere('txn.type = :type', { type: TransactionType.SALE })
      .andWhere('txn.created_at >= :start', { start: since });

    if (cashierId) {
      qb.andWhere('txn.cashier_id = :cashierId', { cashierId });
    }

    const row = await qb.getRawOne<{ total: string; count: string }>();
    return {
      total: Number(row?.total ?? 0),
      count: Number(row?.count ?? 0),
    };
  }

  async periodAggregateSystem(since: Date): Promise<PeriodAggregate> {
    const row = await this.transactionRepo
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(txn.total), 0)', 'total')
      .addSelect('COUNT(txn.id)', 'count')
      .where('txn.type = :type', { type: TransactionType.SALE })
      .andWhere('txn.created_at >= :start', { start: since })
      .getRawOne<{ total: string; count: string }>();
    return {
      total: Number(row?.total ?? 0),
      count: Number(row?.count ?? 0),
    };
  }

  async findRecentScopedTransactions(where: {
    cashierId?: string;
    branchId: string;
  }): Promise<Sale[]> {
    return this.transactionRepo.find({
      where,
      relations: ['items', 'cashier'],
      order: { createdAt: 'DESC' },
    });
  }

  async topProductsSince(since: Date, take: number): Promise<TopProductRow[]> {
    const rows = await this.transactionItemRepo
      .createQueryBuilder('ti')
      .select('ti.product_id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('SUM(ti.quantity)', 'totalQuantity')
      .addSelect('SUM(ti.line_total)', 'totalRevenue')
      .innerJoin('ti.product', 'p')
      .innerJoin('ti.sale', 't')
      .where('t.created_at >= :since', { since })
      .groupBy('ti.product_id')
      .addGroupBy('p.name')
      .orderBy('SUM(ti.line_total)', 'DESC')
      .limit(take)
      .getRawMany<{
        productId: string;
        productName: string;
        totalQuantity: string;
        totalRevenue: string;
      }>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalQuantity: Number(r.totalQuantity),
      totalRevenue: Number(r.totalRevenue),
    }));
  }

  async countActiveProducts(): Promise<number> {
    const rows = await this.transactionItemRepo.manager.query<
      { count: string }[]
    >(`SELECT COUNT(*) as count FROM products WHERE is_active = true`);
    return Number(rows[0].count);
  }

  async countLowStockItems(): Promise<number> {
    const rows = await this.transactionItemRepo.manager.query<
      { count: string }[]
    >(
      `SELECT COUNT(*) as count FROM inventory WHERE quantity <= low_stock_threshold`,
    );
    return Number(rows[0].count);
  }

  async countAllUsers(): Promise<number> {
    const rows = await this.transactionItemRepo.manager.query<
      { count: string }[]
    >(`SELECT COUNT(*) as count FROM users`);
    return Number(rows[0].count);
  }

  async countActiveBranches(): Promise<number> {
    const rows = await this.transactionItemRepo.manager.query<
      { count: string }[]
    >(`SELECT COUNT(*) as count FROM branches WHERE is_active = true`);
    return Number(rows[0].count);
  }

  /**
   * Active branches (id + name) for the dashboard trend legend and the
   * revenue-by-branch colour map. When `branchId` is non-null (manager scope)
   * the result is narrowed to that single branch so the multi-line trend and
   * donut only ever surface the actor's own branch.
   */
  async listBranches(
    branchId: string | null,
  ): Promise<{ id: string; name: string }[]> {
    if (branchId) {
      return this.transactionItemRepo.manager.query<
        { id: string; name: string }[]
      >(
        `SELECT id, name FROM branches WHERE is_active = true AND id = $1 ORDER BY name`,
        [branchId],
      );
    }
    return this.transactionItemRepo.manager.query<
      { id: string; name: string }[]
    >(`SELECT id, name FROM branches WHERE is_active = true ORDER BY name`);
  }

  /**
   * Inventory tiles for the dashboard: row count, low-stock and out-of-stock
   * counts (same CASE-sum shape as branch-performance), plus on-hand valuation
   * (Σ quantity × product.cost_price). Branch-scoped for non-admins. Read-only,
   * parameter-bound — uses raw SQL through the shared manager to mirror the
   * existing count helpers and avoid pulling extra repositories into the module.
   */
  async inventorySummary(branchId: string | null): Promise<InventorySummary> {
    const params = branchId ? [branchId] : [];
    const counts = await this.transactionItemRepo.manager.query<
      { total: string; low: string; out: string }[]
    >(
      `SELECT COUNT(inv.id) AS total,
              COALESCE(SUM(CASE WHEN inv.quantity <= inv.low_stock_threshold THEN 1 ELSE 0 END), 0) AS low,
              COALESCE(SUM(CASE WHEN inv.quantity = 0 THEN 1 ELSE 0 END), 0) AS out
       FROM inventory inv
       ${branchId ? 'WHERE inv.branch_id = $1' : ''}`,
      params,
    );
    const valuation = await this.transactionItemRepo.manager.query<
      { value: string }[]
    >(
      `SELECT COALESCE(SUM(inv.quantity * p.cost_price), 0) AS value
       FROM inventory inv
       INNER JOIN products p ON p.id = inv.product_id
       ${branchId ? 'WHERE inv.branch_id = $1' : ''}`,
      params,
    );
    const c = counts[0];
    return {
      totalProducts: Number(c?.total ?? 0),
      lowStock: Number(c?.low ?? 0),
      outOfStock: Number(c?.out ?? 0),
      inventoryValue: Math.round(Number(valuation[0]?.value ?? 0) * 100) / 100,
    };
  }

  async findIdempotencyKey(
    cashierId: string,
    key: string,
  ): Promise<IdempotencyKey | null> {
    return this.idempotencyRepo.findOne({ where: { cashierId, key } });
  }

  async insertIdempotencyKey(row: {
    key: string;
    cashierId: string;
    saleId: string;
  }): Promise<void> {
    await this.idempotencyRepo.insert(row);
  }
}
