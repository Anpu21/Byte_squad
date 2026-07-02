import { Injectable } from '@nestjs/common';
import { DataSource, In, SelectQueryBuilder } from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import {
  PROFIT_EXPR,
  REVENUE_EXPR,
  UNITS_EXPR,
} from '@/modules/brands/lib/sales-aggregates';
import type {
  BrandBranchBreakdownEntry,
  BrandProductBreakdownEntry,
  BrandProductRosterEntry,
  BrandRosterEntry,
} from '@/modules/brands/brand-branch.util';
import type {
  BrandBranchOption,
  BrandBranchSort,
} from '@/modules/brands/types';

export interface BrandBranchParams {
  branchIds: string[];
  startDate: Date;
  endDate: Date;
}

export interface BrandBranchProductsPageOptions {
  search?: string;
  sort: BrandBranchSort;
  limit: number;
  skip: number;
}

/** Single-row totals for one brand across the selected branches. */
export interface BrandBranchSummary {
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
}

/** One raw (day, branch) trend bucket — the service zero-fills per branch. */
export interface BrandBranchTrendEntry {
  branchId: string;
  date: string;
  revenue: number;
  units: number;
}

interface BrandRosterRaw {
  brandId: string | null;
  brandName: string | null;
  color: string | null;
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface BrandBreakdownRaw {
  brandId: string | null;
  branchId: string;
  units: string | null;
  revenue: string | null;
  profit: string | null;
}

interface ProductRosterRaw {
  productId: string;
  productName: string;
  units: string | null;
  revenue: string | null;
  profit: string | null;
}

interface ProductBreakdownRaw {
  productId: string;
  branchId: string;
  units: string | null;
  revenue: string | null;
  profit: string | null;
}

interface SummaryRaw {
  units: string | null;
  revenue: string | null;
  profit: string | null;
  transactions: string | null;
}

interface TrendRaw {
  branchId: string;
  day: string;
  revenue: string | null;
  units: string | null;
}

interface CountRaw {
  count: string | null;
}

/**
 * Brand×branch comparison queries (DataSource-injected per Rules.md §7).
 * Aggregates use the same expressions and voided-sale predicates as
 * `BrandRepository`, so a single-branch selection here reconciles exactly with
 * the brand overview/drilldown numbers. Kept separate from the (already large)
 * BrandRepository so this cross-branch query family stays focused and
 * testable — mirroring `BranchAnalyticsProductsRepository`.
 */
@Injectable()
export class BrandBranchRepository {
  constructor(private readonly dataSource: DataSource) {}

  /** Branch id+name lookup, echoed back in the REQUESTED order (column order). */
  async findBranchesByIds(ids: string[]): Promise<BrandBranchOption[]> {
    const branches = await this.dataSource
      .getRepository(Branch)
      .findBy({ id: In(ids) });
    const byId = new Map(branches.map((b) => [b.id, b]));
    return ids
      .map((id) => byId.get(id))
      .filter((b): b is Branch => Boolean(b))
      .map((b) => ({ branchId: b.id, branchName: b.name }));
  }

  /**
   * Shared sale-item base: SALE-type, non-voided sales (and non-voided lines)
   * in the window, limited to the selected branches, joined to their product.
   * Same predicates as `BrandRepository.salesItemsBase`, with a branch-set
   * filter instead of the single optional branch.
   */
  private salesItemsBase(
    params: BrandBranchParams,
  ): SelectQueryBuilder<SaleItem> {
    return this.dataSource
      .getRepository(SaleItem)
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .innerJoin('item.product', 'product')
      .where('sale.branch_id IN (:...branchIds)', {
        branchIds: params.branchIds,
      })
      .andWhere('sale.type = :type', { type: TransactionType.SALE })
      .andWhere('sale.status != :voided', { voided: 'Voided' })
      .andWhere('item.status != :voided')
      .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      });
  }

  /**
   * Every brand's totals across the selected branches, ranked by revenue.
   * LEFT JOIN so products with no brand collapse into the Unbranded bucket
   * (brandId=null) — per-branch cells then sum to the branch's full sales.
   */
  async brandRoster(params: BrandBranchParams): Promise<BrandRosterEntry[]> {
    const rows = await this.salesItemsBase(params)
      .leftJoin('product.brandRef', 'brand')
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
      .getRawMany<BrandRosterRaw>();
    return rows.map((r) => ({
      brandId: r.brandId ?? null,
      brandName: r.brandName ?? 'Unbranded',
      color: r.color,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
      transactions: Number(r.transactions ?? 0),
    }));
  }

  /** Per-(brand, branch) cells for the whole selection (roster is unpaginated). */
  async brandBranchBreakdown(
    params: BrandBranchParams,
  ): Promise<BrandBranchBreakdownEntry[]> {
    const rows = await this.salesItemsBase(params)
      .leftJoin('product.brandRef', 'brand')
      .select('brand.id', 'brandId')
      .addSelect('sale.branch_id', 'branchId')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .groupBy('brand.id')
      .addGroupBy('sale.branch_id')
      .getRawMany<BrandBreakdownRaw>();
    return rows.map((r) => ({
      brandId: r.brandId ?? null,
      branchId: r.branchId,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
    }));
  }

  /** Shared drilldown filter: one brand, optional product-name search. */
  private brandProductsBase(
    params: BrandBranchParams,
    brandId: string,
    search?: string,
  ): SelectQueryBuilder<SaleItem> {
    const qb = this.salesItemsBase(params).andWhere(
      'product.brand_id = :brandId',
      { brandId },
    );
    const term = search?.trim();
    if (term) {
      qb.andWhere('product.name ILIKE :search', { search: `%${term}%` });
    }
    return qb;
  }

  /** Totals for one brand across the selection (drilldown KPIs + share base). */
  async brandSummary(
    params: BrandBranchParams,
    brandId: string,
  ): Promise<BrandBranchSummary> {
    const raw = await this.brandProductsBase(params, brandId)
      .select(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .addSelect('COUNT(DISTINCT sale.id)', 'transactions')
      .getRawOne<SummaryRaw>();
    return {
      units: Number(raw?.units ?? 0),
      revenue: Number(raw?.revenue ?? 0),
      profit: Number(raw?.profit ?? 0),
      transactions: Number(raw?.transactions ?? 0),
    };
  }

  /** Count of distinct products of the brand sold in the selection. */
  async countBrandProducts(
    params: BrandBranchParams,
    brandId: string,
    search?: string,
  ): Promise<number> {
    const raw = await this.brandProductsBase(params, brandId, search)
      .select('COUNT(DISTINCT product.id)', 'count')
      .getRawOne<CountRaw>();
    return Number(raw?.count ?? 0);
  }

  /**
   * One page of the brand's products, ranked by `sort` ACROSS the whole
   * selection — pagination is over this roster, then `productsBranchBreakdown`
   * fetches per-branch cells for exactly these products (3-query pattern from
   * `BranchAnalyticsProductsRepository`).
   */
  async brandProductsRosterPage(
    params: BrandBranchParams,
    brandId: string,
    opts: BrandBranchProductsPageOptions,
  ): Promise<BrandProductRosterEntry[]> {
    const sortExpr =
      opts.sort === 'units'
        ? UNITS_EXPR
        : opts.sort === 'profit'
          ? PROFIT_EXPR
          : REVENUE_EXPR;
    const rows = await this.brandProductsBase(params, brandId, opts.search)
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy(sortExpr, 'DESC')
      .addOrderBy('product.name', 'ASC')
      .limit(opts.limit)
      .offset(opts.skip)
      .getRawMany<ProductRosterRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
    }));
  }

  /** Per-(product, branch) cells for exactly one roster page's products. */
  async productsBranchBreakdown(
    params: BrandBranchParams,
    brandId: string,
    productIds: string[],
  ): Promise<BrandProductBreakdownEntry[]> {
    const rows = await this.brandProductsBase(params, brandId)
      .andWhere('item.product_id IN (:...productIds)', { productIds })
      .select('item.product_id', 'productId')
      .addSelect('sale.branch_id', 'branchId')
      .addSelect(UNITS_EXPR, 'units')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(PROFIT_EXPR, 'profit')
      .groupBy('item.product_id')
      .addGroupBy('sale.branch_id')
      .getRawMany<ProductBreakdownRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      branchId: r.branchId,
      units: Number(r.units ?? 0),
      revenue: Number(r.revenue ?? 0),
      profit: Number(r.profit ?? 0),
    }));
  }

  /** Raw daily revenue/units per branch for one brand (service zero-fills). */
  async brandTrendByBranch(
    params: BrandBranchParams,
    brandId: string,
  ): Promise<BrandBranchTrendEntry[]> {
    const dayExpr = "TO_CHAR(sale.created_at, 'YYYY-MM-DD')";
    const rows = await this.brandProductsBase(params, brandId)
      .select('sale.branch_id', 'branchId')
      .addSelect(dayExpr, 'day')
      .addSelect(REVENUE_EXPR, 'revenue')
      .addSelect(UNITS_EXPR, 'units')
      .groupBy('sale.branch_id')
      .addGroupBy(dayExpr)
      .orderBy(dayExpr, 'ASC')
      .getRawMany<TrendRaw>();
    return rows.map((r) => ({
      branchId: r.branchId,
      date: r.day,
      revenue: Number(r.revenue ?? 0),
      units: Number(r.units ?? 0),
    }));
  }
}
