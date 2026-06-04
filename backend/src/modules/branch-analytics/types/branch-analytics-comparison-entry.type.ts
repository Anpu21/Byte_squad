import type {
  BranchCustomerMetrics,
  BranchFinancialMetrics,
  BranchInventoryMetrics,
  BranchLoyaltyMetrics,
  BranchPaymentMetrics,
  BranchSalesMetrics,
  BranchStaffMetrics,
} from './branch-analytics-metrics.type';

export interface BranchAnalyticsComparisonEntry {
  branchId: string;
  branchName: string;
  isOwnBranch: boolean;
  financial: BranchFinancialMetrics;
  sales: BranchSalesMetrics;
  inventory: BranchInventoryMetrics;
  loyalty: BranchLoyaltyMetrics;
  customers: BranchCustomerMetrics;
  payments: BranchPaymentMetrics;
  staff: BranchStaffMetrics;
}
