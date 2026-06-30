import type { IBrandSalesRow } from './brand-sales-row.type'
import type { IBrandProductRow } from './brand-product-row.type'
import type { IBrandTrendPoint } from './brand-trend-point.type'

/** Brand leaderboard — every brand ranked by revenue for the window. */
export interface IBrandOverviewResponse {
  startDate: string
  endDate: string
  /** Resolved scope: a branch id, or null for all branches (admin). */
  branchId: string | null
  totalRevenue: number
  totalUnits: number
  totalProfit: number
  totalTransactions: number
  marginPct: number
  rows: IBrandSalesRow[]
}

export interface IBrandAnalyticsBrand {
  id: string
  name: string
  color: string | null
}

/** One brand's drill-down — KPIs, per-product breakdown, and revenue trend. */
export interface IBrandDrilldownResponse {
  startDate: string
  endDate: string
  branchId: string | null
  brand: IBrandAnalyticsBrand
  totalRevenue: number
  totalUnits: number
  totalProfit: number
  totalTransactions: number
  marginPct: number
  products: IBrandProductRow[]
  trend: IBrandTrendPoint[]
}
