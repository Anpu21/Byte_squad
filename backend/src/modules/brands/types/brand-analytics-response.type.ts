import type { BrandSalesRow } from './brand-sales-row.type';
import type { BrandProductRow } from './brand-product-row.type';
import type { BrandCategoryRow } from './brand-category-row.type';
import type { BrandTrendPoint } from './brand-trend-point.type';

/** Brand leaderboard — every brand ranked by revenue for the window. */
export interface BrandOverviewResponse {
  startDate: string;
  endDate: string;
  branchId: string | null;
  totalRevenue: number;
  totalUnits: number;
  totalProfit: number;
  totalTransactions: number;
  marginPct: number;
  rows: BrandSalesRow[];
}

export interface BrandAnalyticsBrand {
  id: string;
  name: string;
  color: string | null;
}

/** One brand's drill-down — KPIs, per-product breakdown, and revenue trend. */
export interface BrandDrilldownResponse {
  startDate: string;
  endDate: string;
  branchId: string | null;
  brand: BrandAnalyticsBrand;
  totalRevenue: number;
  totalUnits: number;
  totalProfit: number;
  totalTransactions: number;
  marginPct: number;
  /** Sales broken down by the categories this brand's products belong to. */
  categories: BrandCategoryRow[];
  products: BrandProductRow[];
  trend: BrandTrendPoint[];
}
