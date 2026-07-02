import type { IBrandAnalyticsBrand } from './brand-analytics-response.type'
import type { IBrandBranchOption } from './brand-branch-comparison-response.type'
import type { IBrandTrendPoint } from './brand-trend-point.type'

/** One branch's zero-filled daily line for the drilled-in brand. */
export interface IBrandBranchTrendSeries {
  branchId: string
  points: IBrandTrendPoint[]
}

/** Daily revenue/units of one brand, one series per selected branch. */
export interface IBrandBranchTrendResponse {
  brand: IBrandAnalyticsBrand
  branches: IBrandBranchOption[]
  startDate: string
  endDate: string
  series: IBrandBranchTrendSeries[]
}
