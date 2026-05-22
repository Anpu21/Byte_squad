import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, MoreThanOrEqual, Repository } from 'typeorm';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
import { IdempotencyKey } from '@pos/entities/idempotency-key.entity';
import { TransactionType } from '@common/enums/transaction.enum';

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
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(IdempotencyKey)
    private readonly idempotencyRepo: Repository<IdempotencyKey>,
  ) {}

  async createAndSaveTransaction(
    partial: DeepPartial<Transaction>,
  ): Promise<Transaction> {
    return this.transactionRepo.save(this.transactionRepo.create(partial));
  }

  async findTransactionById(id: string): Promise<Transaction | null> {
    return this.transactionRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'cashier'],
    });
  }

  async findTransactionsByBranch(branchId: string): Promise<Transaction[]> {
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
  ): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { cashierId, branchId, createdAt: MoreThanOrEqual(since) },
    });
  }

  async findRecentForCashier(
    cashierId: string,
    branchId: string,
    take: number,
  ): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { cashierId, branchId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take,
    });
  }

  async findTransactionsSince(since: Date): Promise<Transaction[]> {
    return this.transactionRepo.find({
      where: { createdAt: MoreThanOrEqual(since) },
    });
  }

  async findRecent(take: number): Promise<Transaction[]> {
    return this.transactionRepo.find({
      relations: ['items', 'cashier'],
      order: { createdAt: 'DESC' },
      take,
    });
  }

  async findRecentWithBranch(take: number): Promise<Transaction[]> {
    return this.transactionRepo.find({
      relations: ['items', 'cashier', 'branch'],
      order: { createdAt: 'DESC' },
      take,
    });
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
  }): Promise<Transaction[]> {
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
      .innerJoin('ti.transaction', 't')
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

  async findIdempotencyKey(
    cashierId: string,
    key: string,
  ): Promise<IdempotencyKey | null> {
    return this.idempotencyRepo.findOne({ where: { cashierId, key } });
  }

  async insertIdempotencyKey(row: {
    key: string;
    cashierId: string;
    transactionId: string;
  }): Promise<void> {
    await this.idempotencyRepo.insert(row);
  }
}
