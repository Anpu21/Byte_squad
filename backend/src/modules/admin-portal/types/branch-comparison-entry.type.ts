import { TopProduct } from '@admin-portal/types/top-product.type';

export interface BranchComparisonEntry {
  branchId: string;
  branchName: string;
  revenue: number;
  expenses: number;
  expenseRatio: number;
  transactionCount: number;
  avgTransactionValue: number;
  staffCount: number;
  revenuePerStaff: number;
  topProducts: TopProduct[];
}
