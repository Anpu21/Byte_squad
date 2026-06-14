import type { ICategorySalesRow } from './category-sales-row.type'

export interface ICategoryAnalyticsResponse {
  startDate: string
  endDate: string
  /** Resolved scope: a branch id, or null for all branches (admin). */
  branchId: string | null
  totalRevenue: number
  totalUnits: number
  totalTransactions: number
  rows: ICategorySalesRow[]
}
