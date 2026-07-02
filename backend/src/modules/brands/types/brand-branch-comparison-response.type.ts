import type { BrandBranchOption } from './brand-branch-option.type';
import type { BrandBranchRow } from './brand-branch-row.type';

/** Brand×branch comparison — every brand's sales per selected branch. */
export interface BrandBranchComparisonResponse {
  branches: BrandBranchOption[];
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalUnits: number;
  totalProfit: number;
  totalTransactions: number;
  marginPct: number;
  rows: BrandBranchRow[];
}
