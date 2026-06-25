import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { SalesReturn } from '@/modules/inventory-returns/entities/sales-return.entity';
import { SalesReturnItem } from '@/modules/inventory-returns/entities/sales-return-item.entity';

export interface ListReturnsOptions {
  branchId?: string | null;
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

  async listForBranch(opts: ListReturnsOptions): Promise<PagedReturns> {
    const qb = this.repository
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.branch', 'branch');
    if (opts.branchId) {
      qb.andWhere('r.branch_id = :branchId', { branchId: opts.branchId });
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
