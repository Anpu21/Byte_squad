import type { ICategoryBrandRow } from './category-brand-row.type'

/** Head-to-head comparison of every brand selling in one category. */
export interface ICategoryBrandComparisonResponse {
  categoryId: string
  categoryName: string
  startDate: string
  endDate: string
  branchId: string | null
  totalRevenue: number
  totalUnits: number
  totalProfit: number
  totalTransactions: number
  marginPct: number
  brands: ICategoryBrandRow[]
}
