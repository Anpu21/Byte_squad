import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StockAdjustment } from '@/modules/inventory-adjustments/entities/stock-adjustment.entity';
import { StockAdjustmentStatus } from '@common/enums/stock-adjustment-status.enum';

export interface ListAdjustmentsOptions {
  branchId?: string | null;
  status?: StockAdjustmentStatus;
  page: number;
  limit: number;
}

export interface PagedAdjustments {
  items: StockAdjustment[];
  total: number;
}

/**
 * StockAdjustment repository (Phase C2). DataSource-injected per Rules.md §7
 * with an optional EntityManager passthrough so the apply path can persist the
 * adjustment inside the inventory-mutating transaction.
 */
@Injectable()
export class StockAdjustmentRepository {
  private readonly repository: Repository<StockAdjustment>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(StockAdjustment);
  }

  create(input: Partial<StockAdjustment>): StockAdjustment {
    return this.repository.create(input);
  }

  async save(
    entity: StockAdjustment,
    manager?: EntityManager,
  ): Promise<StockAdjustment> {
    const repo = manager
      ? manager.getRepository(StockAdjustment)
      : this.repository;
    return repo.save(entity);
  }

  async findById(id: string): Promise<StockAdjustment | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['product', 'branch'],
    });
  }

  async listForBranch(opts: ListAdjustmentsOptions): Promise<PagedAdjustments> {
    const qb = this.repository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.product', 'product')
      .leftJoinAndSelect('a.branch', 'branch');

    if (opts.branchId) {
      qb.andWhere('a.branch_id = :branchId', { branchId: opts.branchId });
    }
    if (opts.status) {
      qb.andWhere('a.status = :status', { status: opts.status });
    }

    const [items, total] = await qb
      .orderBy('a.createdAt', 'DESC')
      .skip((opts.page - 1) * opts.limit)
      .take(opts.limit)
      .getManyAndCount();

    return { items, total };
  }
}
