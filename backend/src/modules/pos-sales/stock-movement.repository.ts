import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { StockMovement } from '@/modules/pos-sales/entities/stock-movement.entity';

/**
 * StockMovement repository — append-only audit log of inventory deltas
 * triggered by sales, voids, purchases, transfers, adjustments, returns.
 *
 * Follows the Repository Pattern (Rules.md §7): DataSource-injected access,
 * optional EntityManager passthrough so the POS write path can append a
 * movement row inside the same transaction that locks inventory.
 */
@Injectable()
export class StockMovementRepository {
  private readonly repository: Repository<StockMovement>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(StockMovement);
  }

  async create(
    input: DeepPartial<StockMovement>,
    manager?: EntityManager,
  ): Promise<StockMovement> {
    const repo = manager
      ? manager.getRepository(StockMovement)
      : this.repository;
    return repo.save(repo.create(input));
  }

  async findByProductId(productId: string): Promise<StockMovement[]> {
    return this.repository
      .createQueryBuilder('sm')
      .where('sm.product_id = :productId', { productId })
      .orderBy('sm.created_at', 'DESC')
      .getMany();
  }

  async findByRef(refType: string, refId: string): Promise<StockMovement[]> {
    return this.repository
      .createQueryBuilder('sm')
      .where('sm.ref_type = :refType', { refType })
      .andWhere('sm.ref_id = :refId', { refId })
      .orderBy('sm.created_at', 'DESC')
      .getMany();
  }
}
