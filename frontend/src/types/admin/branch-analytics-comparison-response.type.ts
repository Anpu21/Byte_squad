import type { IBranchAnalyticsComparisonEntry } from './branch-analytics-comparison-entry.type'
import type {
  IBranchCustomerMetrics,
  IBranchFinancialMetrics,
  IBranchInventoryMetrics,
  IBranchLoyaltyMetrics,
  IBranchPaymentMetrics,
  IBranchStaffMetrics,
} from './branch-analytics-metrics.type'
import type { IBranchAnalyticsTrend } from './branch-analytics-trend.type'

export interface IBranchAnalyticsSalesTotals {
  transactionCount: number
  avgTransactionValue: number
  discountTotal: number
  taxTotal: number
}

export interface IBranchAnalyticsTotals {
  financial: IBranchFinancialMetrics
  sales: IBranchAnalyticsSalesTotals
  inventory: IBranchInventoryMetrics
  loyalty: IBranchLoyaltyMetrics
  customers: IBranchCustomerMetrics
  payments: IBranchPaymentMetrics
  staff: IBranchStaffMetrics
}

export interface IBranchAnalyticsComparisonResponse {
  startDate: string
  endDate: string
  branches: IBranchAnalyticsComparisonEntry[]
  totals: IBranchAnalyticsTotals
  /**
   * Daily revenue per branch across the range. Present only when the Summary
   * view requests the opt-in `'trend'` section; omitted otherwise.
   */
  trend?: IBranchAnalyticsTrend
}
