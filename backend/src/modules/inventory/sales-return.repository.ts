import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';

export interface ListReturnsOptions {
  branchId?: string | null;
  cashierId?: string | null;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface PagedReturns {
  items: SalesReturn[];
  total: number;
}

/**
 * SalesReturn repository (Phase C3). DataSource-injected per Rules.md §7 with an
 * optional EntityManager passthrough so the return + its items persist inside
 * the same transaction that restocks inventory and posts the refund ledger.
 */
@Injectable()
export class SalesReturnRepository {
  private readonly repository: Repository<SalesReturn>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(SalesReturn);
  }

  create(input: Partial<SalesReturn>): SalesReturn {
    return this.repository.create(input);
  }

  async save(
    entity: SalesReturn,
    manager?: EntityManager,
  ): Promise<SalesReturn> {
    const repo = manager ? manager.getRepository(SalesReturn) : this.repository;
    return repo.save(entity);
  }

  async findById(id: string): Promise<SalesReturn | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['items', 'branch'],
    });
  }

  async listReturns(opts: ListReturnsOptions): Promise<PagedReturns> {
    const qb = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.branch', 'branch')
      // Join the processor but select ONLY safe columns — never the whole
      // User row (it carries the password hash).
      .leftJoin('r.createdBy', 'createdBy')
      .addSelect([
        'createdBy.id',
        'createdBy.firstName',
        'createdBy.lastName',
      ]);
    // Exclude exchange return legs — the returns hub lists refunds only.
    // Exchanges are settled by a replacement sale and shown in sales reports.
    qb.andWhere(`r.type <> 'Exchange'`);
    if (opts.branchId) {
      qb.andWhere('r.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.cashierId) {
      qb.andWhere('r.created_by_user_id = :cashierId', {
        cashierId: opts.cashierId,
      });
    }
    if (opts.startDate) {
      qb.andWhere('DATE(r.created_at) >= :startDate', {
        startDate: opts.startDate,
      });
    }
    if (opts.endDate) {
      qb.andWhere('DATE(r.created_at) <= :endDate', { endDate: opts.endDate });
    }
    if (opts.search?.trim()) {
      qb.andWhere('r.invoice_number ILIKE :search', {
        search: `%${opts.search.trim()}%`,
      });
    }
    if (opts.status) {
      qb.andWhere('r.status = :status', { status: opts.status });
    }
    const [items, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getManyAndCount();
    return { items, total };
  }

  /**
   * Total already-returned quantity (good + bad, in the sold unit) per sale
   * item for a given sale — used to clamp a second return to what remains.
   */
  async returnedQtyBySale(saleId: string): Promise<Map<string, number>> {
    const rows = await this.dataSource
      .getRepository(SalesReturnItem)
      .createQueryBuilder('ri')
      .innerJoin('sales_returns', 'r', 'r.id = ri.return_id')
      .select('ri.sale_item_id', 'saleItemId')
      .addSelect('SUM(ri.good_quantity + ri.bad_quantity)', 'returnedQty')
      .where('r.sale_id = :saleId', { saleId })
      .groupBy('ri.sale_item_id')
      .getRawMany<{ saleItemId: string; returnedQty: string }>();

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.saleItemId, Number(row.returnedQty));
    }
    return map;
  }
}
