import type { BranchAnalyticsProductMetric } from './branch-analytics-product-row.type'

export interface IBranchAnalyticsProductsRequest {
  branchIds?: string[]
  startDate: string
  endDate: string
  search?: string
  sort?: BranchAnalyticsProductMetric
  page?: number
  limit?: number
}
