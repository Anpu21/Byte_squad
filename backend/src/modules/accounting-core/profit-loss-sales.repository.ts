import { Injectable } from '@nestjs/common';
import { Between, DataSource, Repository } from 'typeorm';
import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';

export interface ProfitLossCogs {
  totalCOGS: number;
  itemsSold: number;
}

/**
 * Read-side access to POS sales for the accounting P&L report. Keeps the
 * cross-module Sale/SaleItem queries out of the service (Rules §7 / blaxx
 * nestjs-00 — no TypeORM in services). DataSource-injected, no @InjectRepository.
 */
@Injectable()
export class ProfitLossSalesRepository {
  private readonly sales: Repository<Sale>;
  private readonly items: Repository<SaleItem>;

  constructor(private readonly dataSource: DataSource) {
    this.sales = dataSource.getRepository(Sale);
    this.items = dataSource.getRepository(SaleItem);
  }

  /** Sale figures (gross, discount, tax) in the period, optionally branch-scoped. */
  async salesInPeriod(
    branchId: string | null,
    start: Date,
    end: Date,
  ): Promise<Pick<Sale, 'total' | 'discountAmount' | 'taxAmount'>[]> {
    return this.sales.find({
      where:
        branchId !== null
          ? { branchId, createdAt: Between(start, end) }
          : { createdAt: Between(start, end) },
      select: { total: true, discountAmount: true, taxAmount: true },
    });
  }

  /** Cost of goods sold (cost × qty) and units sold in the period. */
  async cogsInPeriod(
    branchId: string | null,
    start: Date,
    end: Date,
  ): Promise<ProfitLossCogs> {
    const qb = this.items
      .createQueryBuilder('ti')
      .select('SUM(p.cost_price * ti.quantity)', 'totalCOGS')
      .addSelect('SUM(ti.quantity)', 'itemsSold')
      .innerJoin('ti.sale', 't')
      .innerJoin('ti.product', 'p')
      .where('t.created_at BETWEEN :start AND :end', { start, end });
    if (branchId !== null) {
      qb.andWhere('t.branch_id = :branchId', { branchId });
    }
    const row = await qb.getRawOne<{
      totalCOGS: string | null;
      itemsSold: string | null;
    }>();
    return {
      totalCOGS: Number(row?.totalCOGS ?? 0),
      itemsSold: Number(row?.itemsSold ?? 0),
    };
  }
}
