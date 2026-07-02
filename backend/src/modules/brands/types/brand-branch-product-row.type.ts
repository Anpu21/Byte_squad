import type { BrandBranchCell } from './brand-branch-cell.type';

/**
 * One product of the drilled-in brand across every selected branch. Totals
 * span the whole selection; `sharePct` is share of the brand's selection-wide
 * revenue.
 */
export interface BrandBranchProductRow {
  productId: string;
  productName: string;
  units: number;
  revenue: number;
  profit: number;
  marginPct: number;
  sharePct: number;
  perBranch: BrandBranchCell[];
}
