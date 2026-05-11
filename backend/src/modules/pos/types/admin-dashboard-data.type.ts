import { Transaction } from '@pos/entities/transaction.entity';
import { DailyBreakdown } from '@pos/types/daily-breakdown.type';
import { TopProduct } from '@pos/types/top-product.type';

export interface AdminDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  month: {
    totalRevenue: number;
    transactionCount: number;
  };
  stats: {
    activeProducts: number;
    lowStockItems: number;
    totalUsers: number;
    totalBranches: number;
  };
  dailyBreakdown: DailyBreakdown[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
}
