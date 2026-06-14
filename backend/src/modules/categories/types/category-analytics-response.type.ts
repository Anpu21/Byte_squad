import type { CategorySalesRow } from './category-sales-row.type';

export interface CategoryAnalyticsResponse {
  startDate: string;
  endDate: string;
  /** Resolved branch scope: a branch id, or null for all branches (admin). */
  branchId: string | null;
  totalRevenue: number;
  totalUnits: number;
  totalTransactions: number;
  rows: CategorySalesRow[];
}
