import type { BrandBranchCell } from './brand-branch-cell.type';

/**
 * One brand across every selected branch. `brandId` null is the Unbranded
 * bucket (products without a brand), so per-branch cells sum to the branch's
 * full sales. Totals span the whole selection; `sharePct` is share of the
 * selection-wide revenue.
 */
export interface BrandBranchRow {
  brandId: string | null;
  brandName: string;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
  marginPct: number;
  sharePct: number;
  perBranch: BrandBranchCell[];
}
