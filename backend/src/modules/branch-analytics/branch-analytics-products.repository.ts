import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { TransactionType } from '@common/enums/transaction.enum';
import {
  resolvePagination,
  toPaginated,
} from '@common/pagination/paginate.util';
import {
  assembleProductRows,
  type ProductBranchBreakdown,
  type ProductRosterEntry,
} from './products-roster.util';
import type {
  BranchAnalyticsProductSort,
  BranchAnalyticsProductsResponse,
} from './types';

export interface ProductComparisonParams {
  branches: { branchId: string; branchName: string }[];
  startDate: Date;
  endDate: Date;
  search?: string;
  sort: BranchAnalyticsProductSort;
  page?: number;
  limit?: number;
}

interface RosterRaw {
  productId: string;
  productName: string;
  revenue: string | null;
  quantity: string | null;
}

interface BreakdownRaw {
  productId: string;
  branchId: string;
  revenue: string | null;
  quantity: string | null;
}

interface CountRaw {
  count: string | null;
}

const money = (v: string | null): number =>
  Math.round(Number(v ?? 0) * 100) / 100;

/**
 * Accurate product×branch revenue/quantity aggregation for the Products
 * comparison tab. Kept separate from the (already large) BranchAnalytics
 * repository so this one query family stays focused and testable.
 *
 * Pagination is over the PRODUCT roster (ranked across all selected branches),
 * then a second pass fetches the per-branch breakdown for exactly that page of
 * products — so every branch's number is real (`assembleProductRows` zero-fills
 * genuine absences), not each branch's independent top-N.
 */
@Injectable()
export class BranchAnalyticsProductsRepository {
  constructor(
    @InjectRepository(SaleItem)
    private readonly saleItemRepo: Repository<SaleItem>,
  ) {}

  async getProductComparison(
    params: ProductComparisonParams,
  ): Promise<BranchAnalyticsProductsResponse> {
    const branchIds = params.branches.map((b) => b.branchId);
    const { page, limit, skip } = resolvePagination({
      page: params.page,
      limit: params.limit,
    });
    const sortExpr =
      params.sort === 'quantity'
        ? 'COALESCE(SUM(item.quantity), 0)'
        : 'COALESCE(SUM(item.line_total), 0)';

    // A (count) + B (roster page) share the product-joined filtered query.
    const [total, roster] = await Promise.all([
      this.countProducts(params, branchIds),
      this.rosterPage(params, branchIds, sortExpr, limit, skip),
    ]);

    // C — per-branch breakdown for exactly the page's products.
    const productIds = roster.map((r) => r.productId);
    const breakdown =
      productIds.length > 0
        ? await this.branchBreakdown(params, branchIds, productIds)
        : [];

    const base = toPaginated(
      assembleProductRows(roster, breakdown, branchIds),
      total,
      page,
      limit,
    );
    return {
      ...base,
      branches: params.branches,
      startDate: params.startDate.toISOString(),
      endDate: params.endDate.toISOString(),
      sort: params.sort,
    };
  }

  /** Shared WHERE: selected branches, real sales, non-voided sale AND line. */
  private baseQuery(
    params: ProductComparisonParams,
    branchIds: string[],
  ): SelectQueryBuilder<SaleItem> {
    return this.saleItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.sale', 'sale')
      .where('sale.branch_id IN (:...branchIds)', { branchIds })
      .andWhere('sale.type = :type', { type: TransactionType.SALE })
      .andWhere('sale.status != :voided', { voided: 'Voided' })
      .andWhere('item.status != :itemVoided', { itemVoided: 'Voided' })
      .andWhere('sale.created_at BETWEEN :startDate AND :endDate', {
        startDate: params.startDate,
        endDate: params.endDate,
      });
  }

  /** Add the product join + optional name search (roster/count only). */
  private withProduct(
    qb: SelectQueryBuilder<SaleItem>,
    search?: string,
  ): SelectQueryBuilder<SaleItem> {
    qb.innerJoin('item.product', 'product');
    const term = search?.trim();
    if (term) {
      qb.andWhere('product.name ILIKE :search', { search: `%${term}%` });
    }
    return qb;
  }

  private async countProducts(
    params: ProductComparisonParams,
    branchIds: string[],
  ): Promise<number> {
    const raw = await this.withProduct(
      this.baseQuery(params, branchIds),
      params.search,
    )
      .select('COUNT(DISTINCT item.product_id)', 'count')
      .getRawOne<CountRaw>();
    return Number(raw?.count ?? 0);
  }

  private async rosterPage(
    params: ProductComparisonParams,
    branchIds: string[],
    sortExpr: string,
    limit: number,
    skip: number,
  ): Promise<ProductRosterEntry[]> {
    const rows = await this.withProduct(
      this.baseQuery(params, branchIds),
      params.search,
    )
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('COALESCE(SUM(item.line_total), 0)', 'revenue')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy(sortExpr, 'DESC')
      .addOrderBy('product.name', 'ASC')
      .limit(limit)
      .offset(skip)
      .getRawMany<RosterRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      productName: r.productName,
      totalRevenue: money(r.revenue),
      totalQuantity: Number(r.quantity ?? 0),
    }));
  }

  private async branchBreakdown(
    params: ProductComparisonParams,
    branchIds: string[],
    productIds: string[],
  ): Promise<ProductBranchBreakdown[]> {
    const rows = await this.baseQuery(params, branchIds)
      .andWhere('item.product_id IN (:...productIds)', { productIds })
      .select('item.product_id', 'productId')
      .addSelect('sale.branch_id', 'branchId')
      .addSelect('COALESCE(SUM(item.line_total), 0)', 'revenue')
      .addSelect('COALESCE(SUM(item.quantity), 0)', 'quantity')
      .groupBy('item.product_id')
      .addGroupBy('sale.branch_id')
      .getRawMany<BreakdownRaw>();
    return rows.map((r) => ({
      productId: r.productId,
      branchId: r.branchId,
      revenue: money(r.revenue),
      quantity: Number(r.quantity ?? 0),
    }));
  }
}
