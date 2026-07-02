import type {
  BranchAnalyticsProductMetric,
  IBranchAnalyticsProductRow,
} from './branch-analytics-product-row.type'

export interface IBranchAnalyticsProductsResponse {
  items: IBranchAnalyticsProductRow[]
  total: number
  page: number
  limit: number
  totalPages: number
  /** Selected branches in request order — drives stable per-branch colors. */
  branches: { branchId: string; branchName: string }[]
  startDate: string
  endDate: string
  sort: BranchAnalyticsProductMetric
}
