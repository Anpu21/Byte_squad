import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { Product } from '@products/entities/product.entity';

/**
 * Brand repository (DataSource-injected per Rules.md §7). Owns brand CRUD reads,
 * the denormalized-mirror sync used after a rename, and (Phase 2) the brand
 * sales-analytics aggregations.
 */
@Injectable()
export class BrandRepository {
  private readonly repository: Repository<Brand>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Brand);
  }

  create(input: Partial<Brand>): Brand {
    return this.repository.create(input);
  }

  async save(entity: Brand): Promise<Brand> {
    return this.repository.save(entity);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async findById(id: string): Promise<Brand | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Brand | null> {
    return this.repository.findOne({ where: { name } });
  }

  async list(includeInactive: boolean): Promise<Brand[]> {
    const qb = this.repository
      .createQueryBuilder('b')
      .orderBy('b.sortOrder', 'ASC')
      .addOrderBy('b.name', 'ASC');
    if (!includeInactive) {
      qb.where('b.is_active = true');
    }
    return qb.getMany();
  }

  /** Keep the denormalized `products.brand` string in sync after a rename. */
  async syncProductBrandName(brandId: string, name: string): Promise<void> {
    await this.dataSource
      .getRepository(Product)
      .update({ brandId }, { brand: name });
  }
}
