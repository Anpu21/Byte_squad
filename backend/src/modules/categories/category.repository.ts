import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Category } from '@/modules/categories/entities/category.entity';
import { Product } from '@products/entities/product.entity';
import { SaleItem } from '@/modules/pos-sales/entities/sale-item.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import type { CategorySalesRow } from '@/modules/categories/types';

interface CategoryAnalyticsParams {
  branchId: string | null;
  startDate: Date;
  endDate: Date;
}

interface CategorySalesAggRaw {
  categoryId: string;
  categoryName: string;
  color: string | null;
  units: string | null;
  revenue: string | null;
  transactions: string | null;
}

/**
 * Category repository (DataSource-injected per Rules.md §7). Owns category CRUD
 * reads plus the per-category sales aggregation and the denormalized-mirror
 * sync used after a rename.
 */
@Injectable()
export class CategoryRepository {
  private readonly repository: Repository<Category>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(Category);
  }

  create(input: Partial<Category>): Category {
    return this.repository.create(input);
  }

  async save(entity: Category): Promise<Category> {
    return this.repository.save(entity);
  }

  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({ where: { name } });
  }

  async list(includeInactive: boolean): Promise<Category[]> {
    const qb = this.repository
      .createQueryBuilder('c')
      .orderBy('c.sortOrder', 'ASC')
      .addOrderBy('c.name', 'ASC');
    if (!includeInactive) {
      qb.where('c.is_active = true');
    }
    return qb.getMany();
  }

  /** Keep the denormalized `products.category` string in sync after a rename. */
  async syncProductCategoryName(
    categoryId: string,
    name: string,
  ): Promise<void> {
    await this.dataSource
      .getRepository(Product)
      .update({ categoryId }, { category: name });
  }

  /**
   * Sales aggregated by category for a branch (or all branches when null).
   * Mirrors the top-products aggregation in `branch-analytics.repository.ts`
   * but groups on the product's category FK.
   */
  async salesByCategory(
    params: CategoryAnalyticsParams,
  ): Promise<CategorySalesRow[]> {
    const qb = this.dataSource
      .getRepository(SaleItem)
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('item.product', 'product')
      .innerJoin('product.categoryRef', 'cat')
      .select('cat.id', 'categoryId')
      .addSelect('cat.name', 'categoryName')
      .addSelect('cat.color', 'color')
      .addSelect('COALESCE(SUM(item.base_unit_qty), 0)', 'units')
      .addSelect('COALESCE(SUM(item.line_total), 0)', 'revenue')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .where('sale.type = :type', { type: TransactionType.SALE })
      .andWhere('sale.status != :voided', { voided: 'Voided' })
      .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      });

    if (params.branchId) {
      qb.andWhere('sale.branch_id = :branchId', { branchId: params.branchId });
    }

    const rows = await qb
      .groupBy('cat.id')
      .addGroupBy('cat.name')
      .addGroupBy('cat.color')
      .orderBy('COALESCE(SUM(item.line_total), 0)', 'DESC')
      .getRawMany<CategorySalesAggRaw>();

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      transactions: Number(r.transactions ?? 0),
      sharePct: 0, // filled by the service against the window total
    }));
  }
}
