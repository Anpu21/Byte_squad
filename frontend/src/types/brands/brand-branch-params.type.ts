/** Measure the brand×branch views rank and colour by. */
export type BrandBranchMetric = 'revenue' | 'units' | 'profit'

/** Body for POST /brands/analytics/by-branch. */
export interface IBrandBranchComparisonRequest {
  branchIds: string[]
  startDate: string
  endDate: string
}

/** Body for POST /brands/analytics/by-branch/products. */
export interface IBrandBranchProductsRequest
  extends IBrandBranchComparisonRequest {
  brandId: string
  search?: string
  sort?: BrandBranchMetric
  page?: number
  limit?: number
}

/** Body for POST /brands/analytics/by-branch/trend. */
export interface IBrandBranchTrendRequest
  extends IBrandBranchComparisonRequest {
  brandId: string
}
