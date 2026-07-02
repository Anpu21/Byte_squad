import type { IPaginated } from '@common/pagination/paginated.type';
import type { BrandAnalyticsBrand } from './brand-analytics-response.type';
import type { BrandBranchOption } from './brand-branch-option.type';
import type { BrandBranchProductRow } from './brand-branch-product-row.type';

export type BrandBranchSort = 'revenue' | 'units' | 'profit';

/** One page of a brand's product×branch matrix across the selected branches. */
export interface BrandBranchProductsResponse
  extends IPaginated<BrandBranchProductRow> {
  brand: BrandAnalyticsBrand;
  branches: BrandBranchOption[];
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalUnits: number;
  totalProfit: number;
  marginPct: number;
  sort: BrandBranchSort;
}
