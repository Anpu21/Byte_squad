export type BranchAnalyticsProductSort = 'revenue' | 'quantity';

export interface BranchAnalyticsProductPerBranch {
  branchId: string;
  revenue: number;
  quantity: number;
}

export interface BranchAnalyticsProductRow {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantity: number;
  /**
   * One entry per selected branch, in the request's branch order. Zero-filled
   * when a branch had no sales of this product in range — a genuine 0, never a
   * dropped row (this is the accuracy fix over the old top-5-per-branch view).
   */
  perBranch: BranchAnalyticsProductPerBranch[];
}
