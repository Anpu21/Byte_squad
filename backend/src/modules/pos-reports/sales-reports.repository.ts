import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import type { SalesmanReportRow } from '@/modules/pos-sales/types/salesman-report-row.type';

export interface SalesmanReportOptions {
  /** Inclusive ISO dates (`YYYY-MM-DD`). */
  startDate: string;
  endDate: string;
  branchId?: string;
}

interface RawSalesmanRow {
  cashierId: string;
  cashierName: string;
  salesCount: string;
  grossTotal: string;
  discountTotal: string;
  netTotal: string;
  voidedCount: string;
}

/** Read-side aggregates for the sales reports (Rules.md §7). */
@Injectable()
export class SalesReportsRepository {
  private readonly sales: Repository<Sale>;

  constructor(private readonly dataSource: DataSource) {
    this.sales = dataSource.getRepository(Sale);
  }

  /** Per-cashier totals over a date window, busiest till first. */
  async salesmanSummary(
    opts: SalesmanReportOptions,
  ): Promise<SalesmanReportRow[]> {
    const qb = this.sales
      .createQueryBuilder('s')
      .innerJoin('s.cashier', 'u')
      .select('s.cashier_id', 'cashierId')
      .addSelect(`u.first_name || ' ' || u.last_name`, 'cashierName')
      .addSelect(`COUNT(*) FILTER (WHERE s.status = 'Active')`, 'salesCount')
      .addSelect(
        `COALESCE(SUM(s.subtotal) FILTER (WHERE s.status = 'Active'), 0)`,
        'grossTotal',
      )
      .addSelect(
        `COALESCE(SUM(s.discount_amount) FILTER (WHERE s.status = 'Active'), 0)`,
        'discountTotal',
      )
      .addSelect(
        `COALESCE(SUM(s.total) FILTER (WHERE s.status = 'Active'), 0)`,
        'netTotal',
      )
      .addSelect(`COUNT(*) FILTER (WHERE s.status = 'Voided')`, 'voidedCount')
      .where('s.created_at::date BETWEEN :startDate AND :endDate', {
        startDate: opts.startDate,
        endDate: opts.endDate,
      })
      .groupBy('s.cashier_id')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .orderBy('"netTotal"', 'DESC');
    if (opts.branchId) {
      qb.andWhere('s.branch_id = :branchId', { branchId: opts.branchId });
    }
    const raw = await qb.getRawMany<RawSalesmanRow>();
    return raw.map((row) => ({
      cashierId: row.cashierId,
      cashierName: row.cashierName,
      salesCount: Number(row.salesCount),
      grossTotal: Number(row.grossTotal),
      discountTotal: Number(row.discountTotal),
      netTotal: Number(row.netTotal),
      voidedCount: Number(row.voidedCount),
    }));
  }
}
