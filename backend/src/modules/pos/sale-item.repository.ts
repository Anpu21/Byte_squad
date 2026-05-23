import { Injectable } from '@nestjs/common';
import { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';
import { SaleItem } from '@pos/entities/sale-item.entity';

/**
 * SaleItem repository — Rules.md §7 (DataSource-injected, no
 * `@InjectRepository`). Phase 2 ships the bare persistence helpers so
 * Phase 5's checkout transaction can batch-insert line items. Read
 * queries against `sale_items` continue to flow through PosRepository
 * (and via the Sale relation graph) until Phase 5 splits the surface.
 */
@Injectable()
export class SaleItemRepository {
  private readonly repository: Repository<SaleItem>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(SaleItem);
  }

  async create(
    input: DeepPartial<SaleItem>,
    manager?: EntityManager,
  ): Promise<SaleItem> {
    const repo = manager ? manager.getRepository(SaleItem) : this.repository;
    return repo.save(repo.create(input));
  }

  async createMany(
    inputs: DeepPartial<SaleItem>[],
    manager?: EntityManager,
  ): Promise<SaleItem[]> {
    if (inputs.length === 0) return [];
    const repo = manager ? manager.getRepository(SaleItem) : this.repository;
    return repo.save(inputs.map((i) => repo.create(i)));
  }

  async findBySaleId(saleId: string): Promise<SaleItem[]> {
    return this.repository.find({
      where: { saleId },
      relations: ['product'],
    });
  }
}
