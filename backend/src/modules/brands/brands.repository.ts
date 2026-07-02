import { Injectable } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Brand } from '@/modules/brands/entities/brand.entity';
import { Product } from '@products/entities/product.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import {
  PROFIT_EXPR,
  REVENUE_EXPR,
  UNITS_EXPR,
} from '@/modules/brands/lib/sales-aggregates';
import type {
  BrandSalesRow,
  BrandProductRow,
  BrandCategoryRow,
  BrandTrendPoint,
  CategoryBrandRow,
  CategoryProductRow,
  CategoryProductSort,
} from '@/modules/brands/types';

interface BrandAnalyticsParams {
  branchId: string | null;
  startDate: Date;
  endDate: Date;
}

export interface BrandSummary {
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
}

/** A brand plus how many products reference it (drives the manage UI + delete guard). */
export interface BrandWithCount extends Brand {
  productCount: number;
}

interface BrandSalesAggRaw {
  brandId: string;
  brandName: string;
  color: string | null;
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface BrandProductAggRaw {
  productId: string;
  productName: string;
  units: string | null;
  revenue: string | null;
  profit: string | null;
}

interface BrandCategoryAggRaw {
  categoryId: string;
  categoryName: string;
  color: string | null;
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface CategoryBrandAggRaw {
  brandId: string | null;
  brandName: string | null;
  color: string | null;
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface CategoryProductAggRaw {
  productId: string;
  productName: string;
  brandId: string | null;
  brandName: string | null;
  color: string | null;
  units: string | null;
  revenue: string | null;
  profit: string | null;
}

interface CountRaw {
  count: string | null;
}

export interface CategoryProductsPageOptions {
  brandId?: string;
  search?: string;
  sort: CategoryProductSort;
  limit: number;
  skip: number;
}

interface BrandSummaryRaw {
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface BrandTrendRaw {
  day: string;
  revenue: string | null;
  units: string | null;
}

/**
 * Brand repository (DataSource-injected per Rules.md §7). Owns brand CRUD reads,
 * the denormalized-mirror sync used after a rename, and the brand
 * sales-analytics aggregations (leaderboard, per-brand summary, per-product
 * breakdown, daily trend). Predicates mirror `category.repository.salesByCategory`
 * so brand and category numbers reconcile.
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

  async list(includeInactive: boolean): Promise<BrandWithCount[]> {
    const qb = this.repository
      .createQueryBuilder('b')
      .orderBy('b.sortOrder', 'ASC')
      .addOrderBy('b.name', 'ASC');
    if (!includeInactive) {
      qb.where('b.is_active = true');
    }
    const brands = await qb.getMany();
    if (brands.length === 0) return [];

    const counts = await this.dataSource
      .getRepository(Product)
      .createQueryBuilder('p')
      .select('p.brand_id', 'brandId')
      .addSelect('COUNT(*)', 'count')
      .where('p.brand_id IN (:...ids)', { ids: brands.map((b) => b.id) })
      .groupBy('p.brand_id')
      .getRawMany<{ brandId: string; count: string }>();
    const countMap = new Map(counts.map((c) => [c.brandId, Number(c.count)]));

    return brands.map((b) => ({ ...b, productCount: countMap.get(b.id) ?? 0 }));
  }

  /** Number of products referencing a brand (delete guard). */
  async countProductsForBrand(brandId: string): Promise<number> {
    return this.dataSource.getRepository(Product).count({ where: { brandId } });
  }

  /** Hard-delete a brand row. Callers must ensure no product references it. */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /** Keep the denormalized `products.brand` string in sync after a rename. */
  async syncProductBrandName(brandId: string, name: string): Promise<void> {
    await this.dataSource
      .getRepository(Product)
      .update({ brandId }, { brand: name });
  }

  // ── Analytics ──────────────────────────────────────────

  /**
   * Shared sale-item base query: SALE-type, non-voided sales in the window,
   * optionally scoped to one branch, joined to their product. Each call returns
   * a fresh builder so the analytics methods can layer their own select/group.
   */
  private salesItemsBase(
    params: BrandAnalyticsParams,
  ): SelectQueryBuilder<SaleItem> {
    const qb = this.dataSource
      .getRepository(SaleItem)
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('item.product', 'product')
      .where('sale.type = :type', { type: TransactionType.SALE })
      .andWhere('sale.status != :voided', { voided: 'Voided' })
      .andWhere('item.status != :voided')
      .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      });
    if (params.branchId) {
      qb.andWhere('sale.branch_id = :branchId', { branchId: params.branchId });
    }
    return qb;
  }

  /** Every brand ranked by revenue (leaderboard). Only branded products count. */
  async leaderboard(params: BrandAnalyticsParams): Promise<BrandSalesRow[]> {
    const rows = await this.salesItemsBase(params)
      .innerJoin('product.brandRef', 'brand')
      .select('brand.id', 'brandId')
      .addSelect('brand.name', 'brandName')
      .addSelect('brand.color', 'color')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .groupBy('brand.id')
      .addGroupBy('brand.name')
      .addGroupBy('brand.color')
      .orderBy(REVENUE_EXPR, 'DESC')
      .getRawMany<BrandSalesAggRaw>();
    return rows.map((r) => ({
      brandId: r.brandId,
      brandName: r.brandName,
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      transactions: Number(r.transactions ?? 0),
      marginPct: 0,
      sharePct: 0,
    }));
  }

  /** Single-row totals for one brand (drill-down KPIs incl. distinct orders). */
  async brandSummary(
    params: BrandAnalyticsParams,
    brandId: string,
  ): Promise<BrandSummary> {
    const raw = await this.salesItemsBase(params)
      .andWhere('product.brand_id = :brandId', { brandId })
      .select(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .getRawOne<BrandSummaryRaw>();
    return {
      units: Number(raw?.units ?? 0),
      revenue: Number(raw?.revenue ?? 0),
      profit: Number(raw?.profit ?? 0),
      transactions: Number(raw?.transactions ?? 0),
    };
  }

  /**
   * Per-product breakdown within one brand, ranked by revenue. When
   * `categoryId` is given the list is narrowed to that category ("one category,
   * many products of this brand").
   */
  async productsForBrand(
    params: BrandAnalyticsParams,
    brandId: string,
    categoryId?: string,
  ): Promise<BrandProductRow[]> {
    const qb = this.salesItemsBase(params).andWhere(
      'product.brand_id = :brandId',
      { brandId },
    );
    if (categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId });
    }
    const rows = await qb
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy(REVENUE_EXPR, 'DESC')
      .getRawMany<BrandProductAggRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      marginPct: 0,
      sharePct: 0,
    }));
  }

  /**
   * Per-category breakdown within one brand, ranked by revenue. Categories are
   * derived through the brand's products (inner join to the product's category);
   * products always carry a category, so this reconciles with the brand total.
   */
  async categoriesForBrand(
    params: BrandAnalyticsParams,
    brandId: string,
  ): Promise<BrandCategoryRow[]> {
    const rows = await this.salesItemsBase(params)
      .innerJoin('product.categoryRef', 'category')
      .andWhere('product.brand_id = :brandId', { brandId })
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('category.color', 'color')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .groupBy('category.id')
      .addGroupBy('category.name')
      .addGroupBy('category.color')
      .orderBy(REVENUE_EXPR, 'DESC')
      .getRawMany<BrandCategoryAggRaw>();
    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      transactions: Number(r.transactions ?? 0),
      marginPct: 0,
      sharePct: 0,
    }));
  }

  /** Daily revenue/units for one brand (raw days; service zero-fills gaps). */
  async brandTrend(
    params: BrandAnalyticsParams,
    brandId: string,
  ): Promise<BrandTrendPoint[]> {
    const dayExpr = "TO_CHAR(sale.created_at, 'YYYY-MM-DD')";
    const rows = await this.salesItemsBase(params)
      .andWhere('product.brand_id = :brandId', { brandId })
      .select(dayExpr, 'day')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(UNITS_EXPR, 'units')
      .groupBy(dayExpr)
      .orderBy(dayExpr, 'ASC')
      .getRawMany<BrandTrendRaw>();
    return rows.map((r) => ({
      date: r.day,
      revenue: Number(r.revenue ?? 0),
      units: Number(r.units ?? 0),
    }));
  }

  // ── Category → brands ("same category, different brands") ───────

  /** Single-row totals for one category across all brands (share denominator). */
  async categorySummary(
    params: BrandAnalyticsParams,
    categoryId: string,
  ): Promise<BrandSummary> {
    const raw = await this.salesItemsBase(params)
      .andWhere('product.category_id = :categoryId', { categoryId })
      .select(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .getRawOne<BrandSummaryRaw>();
    return {
      units: Number(raw?.units ?? 0),
      revenue: Number(raw?.revenue ?? 0),
      profit: Number(raw?.profit ?? 0),
      transactions: Number(raw?.transactions ?? 0),
    };
  }

  /**
   * Every brand selling in one category, ranked by revenue. LEFT JOIN so
   * products with no brand collapse into a single Unbranded bucket
   * (brandId=null) — the row set matches `categorySummary`, so they reconcile.
   */
  async brandsForCategory(
    params: BrandAnalyticsParams,
    categoryId: string,
  ): Promise<CategoryBrandRow[]> {
    const rows = await this.salesItemsBase(params)
      .leftJoin('product.brandRef', 'brand')
      .andWhere('product.category_id = :categoryId', { categoryId })
      .select('brand.id', 'brandId')
      .addSelect('brand.name', 'brandName')
      .addSelect('brand.color', 'color')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .groupBy('brand.id')
      .addGroupBy('brand.name')
      .addGroupBy('brand.color')
      .orderBy(REVENUE_EXPR, 'DESC')
      .getRawMany<CategoryBrandAggRaw>();
    return rows.map((r) => ({
      brandId: r.brandId ?? null,
      brandName: r.brandName ?? 'Unbranded',
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      transactions: Number(r.transactions ?? 0),
      marginPct: 0,
      sharePct: 0,
    }));
  }

  /** Shared roster filter: category, optional brand, optional name search. */
  private categoryRosterBase(
    params: BrandAnalyticsParams,
    categoryId: string,
    brandId?: string,
    search?: string,
  ): SelectQueryBuilder<SaleItem> {
    const qb = this.salesItemsBase(params).andWhere(
      'product.category_id = :categoryId',
      { categoryId },
    );
    if (brandId) {
      qb.andWhere('product.brand_id = :brandId', { brandId });
    }
    const term = search?.trim();
    if (term) {
      qb.andWhere('product.name ILIKE :search', { search: `%${term}%` });
    }
    return qb;
  }

  /** Count of distinct products in a category (respecting brand/search). */
  async countCategoryProducts(
    params: BrandAnalyticsParams,
    categoryId: string,
    brandId?: string,
    search?: string,
  ): Promise<number> {
    const raw = await this.categoryRosterBase(
      params,
      categoryId,
      brandId,
      search,
    )
      .select('COUNT(DISTINCT product.id)', 'count')
      .getRawOne<CountRaw>();
    return Number(raw?.count ?? 0);
  }

  /** One page of a category's product roster, brand-tagged, ranked by `sort`. */
  async categoryProductsPage(
    params: BrandAnalyticsParams,
    categoryId: string,
    opts: CategoryProductsPageOptions,
  ): Promise<CategoryProductRow[]> {
    const sortExpr =
      opts.sort === 'units'
        ? UNITS_EXPR
        : opts.sort === 'profit'
          ? PROFIT_EXPR
          : REVENUE_EXPR;
    const rows = await this.categoryRosterBase(
      params,
      categoryId,
      opts.brandId,
      opts.search,
    )
      .leftJoin('product.brandRef', 'brand')
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('brand.id', 'brandId')
      .addSelect('brand.name', 'brandName')
      .addSelect('brand.color', 'color')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .addGroupBy('brand.id')
      .addGroupBy('brand.name')
      .addGroupBy('brand.color')
      .orderBy(sortExpr, 'DESC')
      .addOrderBy('product.name', 'ASC')
      .limit(opts.limit)
      .offset(opts.skip)
      .getRawMany<CategoryProductAggRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      brandId: r.brandId ?? null,
      brandName: r.brandName ?? null,
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      marginPct: 0,
      sharePct: 0,
    }));
  }
}
