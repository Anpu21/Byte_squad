import type { BranchAnalyticsComparisonEntry } from './branch-analytics-comparison-entry.type';
import type {
  BranchCustomerMetrics,
  BranchFinancialMetrics,
  BranchInventoryMetrics,
  BranchLoyaltyMetrics,
  BranchPaymentMetrics,
  BranchSalesMetrics,
  BranchStaffMetrics,
} from './branch-analytics-metrics.type';

export interface BranchAnalyticsTotals {
  financial: BranchFinancialMetrics;
  sales: Omit<BranchSalesMetrics, 'topProducts'>;
  inventory: BranchInventoryMetrics;
  loyalty: BranchLoyaltyMetrics;
  customers: BranchCustomerMetrics;
  payments: BranchPaymentMetrics;
  staff: BranchStaffMetrics;
}

export interface BranchAnalyticsComparisonResponse {
  startDate: string;
  endDate: string;
  branches: BranchAnalyticsComparisonEntry[];
  totals: BranchAnalyticsTotals;
}
