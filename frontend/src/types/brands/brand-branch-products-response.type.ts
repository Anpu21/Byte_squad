import type { IBrandAnalyticsBrand } from './brand-analytics-response.type'
import type { BrandBranchMetric } from './brand-branch-params.type'
import type { IBrandBranchOption } from './brand-branch-comparison-response.type'
import type { IBrandBranchProductRow } from './brand-branch-product-row.type'

/** One page of a brand's product×branch matrix + selection-wide brand KPIs. */
export interface IBrandBranchProductsResponse {
  items: IBrandBranchProductRow[]
  total: number
  page: number
  limit: number
  totalPages: number
  brand: IBrandAnalyticsBrand
  branches: IBrandBranchOption[]
  startDate: string
  endDate: string
  totalRevenue: number
  totalUnits: number
  totalProfit: number
  marginPct: number
  sort: BrandBranchMetric
}
