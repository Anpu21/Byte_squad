import type { BrandAnalyticsBrand } from './brand-analytics-response.type';
import type { BrandBranchOption } from './brand-branch-option.type';
import type { BrandTrendPoint } from './brand-trend-point.type';

/** One branch's zero-filled daily line for the drilled-in brand. */
export interface BrandBranchTrendSeries {
  branchId: string;
  points: BrandTrendPoint[];
}

/** Daily revenue/units of one brand, one series per selected branch. */
export interface BrandBranchTrendResponse {
  brand: BrandAnalyticsBrand;
  branches: BrandBranchOption[];
  startDate: string;
  endDate: string;
  series: BrandBranchTrendSeries[];
}
