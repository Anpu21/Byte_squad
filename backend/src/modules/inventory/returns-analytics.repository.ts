import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import type {
  ReturnsByBranchRow,
  ReturnsByCashierRow,
  ReturnsTotals,
  ReturnsTrendPoint,
} from '@inventory/types';

export interface ReturnsAnalyticsOptions {
  /** Inclusive ISO window (YYYY-MM-DD). */
  startDate: string;
  endDate: string;
  branchId?: string | null;
  cashierId?: string | null;
}

/**
 * Read-side aggregates for the returns dashboard (Rules.md §7). DataSource-
 * injected; kept separate from SalesReturnRepository so the list stays lean.
 * All money comes from `sales_returns`; damaged quantity comes from the audit
 * `stock_movements` (Damage rows written against each return).
 */
@Injectable()
export class ReturnsAnalyticsRepository {
  private readonly returns: Repository<SalesReturn>;
  private readonly movements: Repository<StockMovement>;

  constructor(private readonly dataSource: DataSource) {
    this.returns = dataSource.getRepository(SalesReturn);
    this.movements = dataSource.getRepository(StockMovement);
  }

  /** Apply the shared window + branch/cashier scope to a returns query. */
  private scopeReturns(
    qb: SelectQueryBuilder<SalesReturn>,
    opts: ReturnsAnalyticsOptions,
  ): SelectQueryBuilder<SalesReturn> {
    // The returns dashboard is about REFUNDS. Exchange return legs carry a net
    // refund (0 for even/dearer, R−P for cheaper) and are settled by a
    // replacement sale — counting them here would conflate exchanges with cash
    // refunds. They stay recorded (linked sale) and surface in sales reports.
    qb.where(`r.type <> 'Exchange'`).andWhere(
      'DATE(r.created_at) BETWEEN :startDate AND :endDate',
      {
        startDate: opts.startDate,
        endDate: opts.endDate,
      },
    );
    if (opts.branchId) {
      qb.andWhere('r.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.cashierId) {
      qb.andWhere('r.created_by_user_id = :cashierId', {
        cashierId: opts.cashierId,
      });
    }
    return qb;
  }

  async totals(
    opts: ReturnsAnalyticsOptions,
  ): Promise<Omit<ReturnsTotals, 'damagedQty'>> {
    const qb = this.scopeReturns(this.returns.createQueryBuilder('r'), opts)
      .select('COUNT(*)', 'returnsCount')
      .addSelect('COALESCE(SUM(r.total_refund_amount), 0)', 'totalRefunded')
      .addSelect('COALESCE(SUM(r.restocked_value), 0)', 'restockedValue');
    const row = await qb.getRawOne<{
      returnsCount: string;
      totalRefunded: string;
      restockedValue: string;
    }>();
    return {
      returnsCount: Number(row?.returnsCount ?? 0),
      totalRefunded: Number(row?.totalRefunded ?? 0),
      restockedValue: Number(row?.restockedValue ?? 0),
    };
  }

  /** Damaged units (sold-unit qty) logged against returns in the window. */
  async damagedQty(opts: ReturnsAnalyticsOptions): Promise<number> {
    const qb = this.movements
      .createQueryBuilder('m')
      .select('COALESCE(SUM(m.qty_in), 0)', 'damagedQty')
      .where(`m.movement_type = 'Damage'`)
      .andWhere(`m.ref_type = 'SalesReturn'`)
      // Same refunds-only scope as the money KPIs: drop damage logged against
      // an exchange return leg.
      .andWhere(
        `NOT EXISTS (SELECT 1 FROM sales_returns sr WHERE sr.id = m.ref_id AND sr.type = 'Exchange')`,
      )
      .andWhere('DATE(m.created_at) BETWEEN :startDate AND :endDate', {
        startDate: opts.startDate,
        endDate: opts.endDate,
      });
    if (opts.branchId) {
      qb.andWhere('m.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.cashierId) {
      qb.andWhere('m.created_by_user_id = :cashierId', {
        cashierId: opts.cashierId,
      });
    }
    const row = await qb.getRawOne<{ damagedQty: string }>();
    return Number(row?.damagedQty ?? 0);
  }

  async byBranch(
    opts: ReturnsAnalyticsOptions,
  ): Promise<ReturnsByBranchRow[]> {
    const qb = this.scopeReturns(this.returns.createQueryBuilder('r'), opts)
      .innerJoin('r.branch', 'b')
      .select('r.branch_id', 'branchId')
      .addSelect('b.name', 'branchName')
      .addSelect('COUNT(*)', 'returnsCount')
      .addSelect('COALESCE(SUM(r.total_refund_amount), 0)', 'totalRefunded')
      .groupBy('r.branch_id')
      .addGroupBy('b.name')
      .orderBy('"totalRefunded"', 'DESC');
    const raw = await qb.getRawMany<{
      branchId: string;
      branchName: string;
      returnsCount: string;
      totalRefunded: string;
    }>();
    return raw.map((row) => ({
      branchId: row.branchId,
      branchName: row.branchName,
      returnsCount: Number(row.returnsCount),
      totalRefunded: Number(row.totalRefunded),
    }));
  }

  async byCashier(
    opts: ReturnsAnalyticsOptions,
  ): Promise<ReturnsByCashierRow[]> {
    const qb = this.scopeReturns(this.returns.createQueryBuilder('r'), opts)
      .innerJoin('r.createdBy', 'u')
      .select('r.created_by_user_id', 'cashierId')
      .addSelect(`u.first_name || ' ' || u.last_name`, 'cashierName')
      .addSelect('COUNT(*)', 'returnsCount')
      .addSelect('COALESCE(SUM(r.total_refund_amount), 0)', 'totalRefunded')
      .groupBy('r.created_by_user_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('"totalRefunded"', 'DESC');
    const raw = await qb.getRawMany<{
      cashierId: string;
      cashierName: string;
      returnsCount: string;
      totalRefunded: string;
    }>();
    return raw.map((row) => ({
      cashierId: row.cashierId,
      cashierName: row.cashierName,
      returnsCount: Number(row.returnsCount),
      totalRefunded: Number(row.totalRefunded),
    }));
  }

  async trend(opts: ReturnsAnalyticsOptions): Promise<ReturnsTrendPoint[]> {
    const qb = this.scopeReturns(this.returns.createQueryBuilder('r'), opts)
      .select('DATE(r.created_at)', 'date')
      .addSelect('COUNT(*)', 'returnsCount')
      .addSelect('COALESCE(SUM(r.total_refund_amount), 0)', 'totalRefunded')
      .groupBy('DATE(r.created_at)')
      .orderBy('DATE(r.created_at)', 'ASC');
    const raw = await qb.getRawMany<{
      date: string | Date;
      returnsCount: string;
      totalRefunded: string;
    }>();
    return raw.map((row) => ({
      // pg returns DATE as a JS Date under some drivers; normalize to ISO day.
      date:
        row.date instanceof Date
          ? row.date.toISOString().slice(0, 10)
          : String(row.date).slice(0, 10),
      returnsCount: Number(row.returnsCount),
      totalRefunded: Number(row.totalRefunded),
    }));
  }
}
