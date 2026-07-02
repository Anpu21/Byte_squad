export type BranchAnalyticsProductMetric = 'revenue' | 'quantity'

export interface IBranchAnalyticsProductPerBranch {
  branchId: string
  revenue: number
  quantity: number
}

export interface IBranchAnalyticsProductRow {
  productId: string
  productName: string
  totalRevenue: number
  totalQuantity: number
  /** One entry per selected branch, in request order; zero-filled (a genuine 0,
   * never a dropped branch) when the branch had no sales of this product. */
  perBranch: IBranchAnalyticsProductPerBranch[]
}
