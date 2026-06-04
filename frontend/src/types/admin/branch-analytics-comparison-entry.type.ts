import type {
  IBranchCustomerMetrics,
  IBranchFinancialMetrics,
  IBranchInventoryMetrics,
  IBranchLoyaltyMetrics,
  IBranchPaymentMetrics,
  IBranchSalesMetrics,
  IBranchStaffMetrics,
} from './branch-analytics-metrics.type'

export interface IBranchAnalyticsComparisonEntry {
  branchId: string
  branchName: string
  isOwnBranch: boolean
  financial: IBranchFinancialMetrics
  sales: IBranchSalesMetrics
  inventory: IBranchInventoryMetrics
  loyalty: IBranchLoyaltyMetrics
  customers: IBranchCustomerMetrics
  payments: IBranchPaymentMetrics
  staff: IBranchStaffMetrics
}
