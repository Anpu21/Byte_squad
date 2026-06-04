import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { ProductBatch } from '@inventory/entities/product-batch.entity';

export interface FindExpiringOptions {
  branchId?: string | null;
  withinDays: number;
  page: number;
  limit: number;
}

export interface PagedBatches {
  items: ProductBatch[];
  total: number;
}

/**
 * ProductBatch repository (Phase C1). DataSource-injected per Rules.md §7 with
 * an optional EntityManager passthrough so a goods-receipt can insert the batch
 * row inside the same transaction that bumps inventory + appends a movement.
 */
@Injectable()
export class ProductBatchRepository {
  private readonly repository: Repository<ProductBatch>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(ProductBatch);
  }

  async create(
    input: DeepPartial<ProductBatch>,
    manager?: EntityManager,
  ): Promise<ProductBatch> {
    const repo = manager
      ? manager.getRepository(ProductBatch)
      : this.repository;
    return repo.save(repo.create(input));
  }

  async findById(id: string): Promise<ProductBatch | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['product', 'branch'],
    });
  }

  async listForProduct(
    productId: string,
    branchId: string | null,
  ): Promise<ProductBatch[]> {
    const qb = this.repository
      .createQueryBuilder('b')
      .where('b.product_id = :productId', { productId })
      .andWhere('b.quantity > 0');
    if (branchId) qb.andWhere('b.branch_id = :branchId', { branchId });
    return qb.orderBy('b.expiryDate', 'ASC').getMany();
  }

  /**
   * Batches with positive quantity and a non-null expiry date due within
   * `withinDays`, nearest expiry first. Branch-scoped when `branchId` is set.
   */
  async findExpiring(opts: FindExpiringOptions): Promise<PagedBatches> {
    const qb = this.repository
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.product', 'product')
      .leftJoinAndSelect('b.branch', 'branch')
      .where('b.expiry_date IS NOT NULL')
      .andWhere('b.quantity > 0')
      .andWhere(
        "b.expiry_date <= (CURRENT_DATE + (:withinDays || ' days')::interval)",
        { withinDays: opts.withinDays },
      );

    if (opts.branchId) {
      qb.andWhere('b.branch_id = :branchId', { branchId: opts.branchId });
    }

    const [items, total] = await qb
      .orderBy('b.expiryDate', 'ASC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getManyAndCount();

    return { items, total };
  }
}
