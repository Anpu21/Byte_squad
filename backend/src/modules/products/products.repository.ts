import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { Product } from '@products/entities/product.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {}

  async createAndSave(partial: DeepPartial<Product>): Promise<Product> {
    const entity = this.repo.create(partial);
    return this.repo.save(entity);
  }

  async save(product: Product): Promise<Product> {
    return this.repo.save(product);
  }

  async findActive(): Promise<Product[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: readonly string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In([...ids]) } });
  }

  async findActiveByIds(ids: readonly string[]): Promise<Product[]> {
    if (ids.length === 0) return [];
    return this.repo.find({ where: { id: In([...ids]), isActive: true } });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.repo.findOne({ where: { barcode } });
  }

  async update(id: string, dto: DeepPartial<Product>): Promise<void> {
    await this.repo.update(id, dto);
  }

  async listDistinctActiveCategories(): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('product')
      .select('product.category', 'category')
      .where('product.is_active = :isActive', { isActive: true })
      .distinct(true)
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.repo.update(id, { isActive });
  }
}
