import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  DeepPartial,
  EntityManager,
  In,
  Repository,
} from 'typeorm';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async createAndSave(
    partial: DeepPartial<Product>,
    manager?: EntityManager,
  ): Promise<Product> {
    const repo = manager ? manager.getRepository(Product) : this.repo;
    const entity = repo.create(partial);
    return repo.save(entity);
  }

  async save(product: Product, manager?: EntityManager): Promise<Product> {
    const repo = manager ? manager.getRepository(Product) : this.repo;
    return repo.save(product);
  }

  async findActive(): Promise<Product[]> {
    return this.repo.find({ where: { isActive: true } });
  }

  /**
   * Load a single product with its sellable-unit rows so the manager edit
   * form (and any other single-product consumer) gets the unit list in the
   * same response. Units come back sorted by `displayOrder` to match the
   * editor's expected render order.
   */
  async findById(id: string): Promise<Product | null> {
    return this.repo.findOne({
      where: { id },
      relations: { sellableUnits: true },
      order: { sellableUnits: { displayOrder: 'ASC' } },
    });
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

  async findByBarcodes(barcodes: readonly string[]): Promise<Product[]> {
    if (barcodes.length === 0) return [];
    return this.repo.find({ where: { barcode: In([...barcodes]) } });
  }

  async findUnitByBarcode(
    barcode: string,
  ): Promise<ProductSellableUnit | null> {
    const trimmed = barcode.trim();
    if (!trimmed) return null;
    return this.dataSource
      .getRepository(ProductSellableUnit)
      .createQueryBuilder('unit')
      .innerJoinAndSelect('unit.product', 'product')
      .where('unit.barcode = :barcode', { barcode: trimmed })
      .andWhere('product.is_active = true')
      .getOne();
  }

  async findUnitsByBarcodes(
    barcodes: readonly string[],
    excludeProductId?: string,
  ): Promise<ProductSellableUnit[]> {
    if (barcodes.length === 0) return [];
    const qb = this.dataSource
      .getRepository(ProductSellableUnit)
      .createQueryBuilder('unit')
      .where('unit.barcode IN (:...barcodes)', { barcodes: [...barcodes] });
    if (excludeProductId) {
      qb.andWhere('unit.product_id <> :excludeProductId', {
        excludeProductId,
      });
    }
    return qb.getMany();
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

  /**
   * Prefix-match active products by name OR barcode for the POS cashier
   * typeahead. ILIKE keeps the lookup case-insensitive; we anchor on
   * `${term}%` so an empty term short-circuits to "starts with anything"
   * which the caller filters out separately. Results are sorted by name
   * (deterministic) and capped at `limit`.
   */
  async searchByText(term: string, limit: number): Promise<Product[]> {
    return this.repo
      .createQueryBuilder('p')
      .where('p.is_active = true')
      .andWhere('(p.name ILIKE :pattern OR p.barcode ILIKE :pattern)', {
        pattern: `${term}%`,
      })
      .orderBy('p.name', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * List the sellable-unit rows configured for a product, sorted by
   * `displayOrder`. Callers in the POS layer map the raw entity into the
   * Shanel-shaped `ProductUnitRow` (kept in `@pos/types`) — this repository
   * stays free of cross-module types and just returns entities.
   */
  async listUnits(productId: string): Promise<ProductSellableUnit[]> {
    return this.dataSource.getRepository(ProductSellableUnit).find({
      where: { productId },
      order: { displayOrder: 'ASC' },
    });
  }

  /**
   * Persist a batch of sellable-unit seeds for a product. Used by
   * `ProductsService.create` to wire the base-unit row onto a
   * freshly-inserted product row and by the migration that backfilled
   * existing products. Returns the saved rows so the caller can hand them
   * back to the UI without a follow-up `listUnits`.
   *
   * Pass an `EntityManager` when invoking from inside a transaction so the
   * inserts join the surrounding unit-of-work; otherwise the call lands on
   * the default DataSource repository.
   */
  async saveUnits(
    seeds: DeepPartial<ProductSellableUnit>[],
    manager?: EntityManager,
  ): Promise<ProductSellableUnit[]> {
    if (seeds.length === 0) return [];
    const repo = manager
      ? manager.getRepository(ProductSellableUnit)
      : this.dataSource.getRepository(ProductSellableUnit);
    const rows = seeds.map((s) => repo.create(s));
    return repo.save(rows);
  }

  /**
   * Atomically replace the full sellable-units list for a product:
   * deletes any existing rows, then persists the provided seeds. Use this
   * when the manager edits a product's baseUnit or unit list — the auto-
   * seed safety net (Phase A1 migration) plus this replace keep
   * `product_sellable_units` consistent with the manager's intent.
   *
   * Pass an `EntityManager` to participate in a caller's transaction
   * (recommended for `ProductsService.update` so the product row and its
   * units commit together).
   */
  async replaceUnits(
    productId: string,
    seeds: DeepPartial<ProductSellableUnit>[],
    manager?: EntityManager,
  ): Promise<ProductSellableUnit[]> {
    const repo = manager
      ? manager.getRepository(ProductSellableUnit)
      : this.dataSource.getRepository(ProductSellableUnit);
    await repo.delete({ productId });
    if (seeds.length === 0) return [];
    const rows = seeds.map((s) => repo.create(s));
    return repo.save(rows);
  }
}
