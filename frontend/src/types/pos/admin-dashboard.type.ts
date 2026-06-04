import type { IDailyBreakdown } from './daily-breakdown.type';
import type { ITopProduct } from './top-product.type';
import type { ISale } from './sale.type';

/**
 * Response envelope for `GET /pos/admin-dashboard` (admin/manager-scoped).
 * Mirrors `backend/src/modules/pos/types/admin-dashboard-data.type.ts`.
 */
export interface IAdminDashboard {
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
  dailyBreakdown: IDailyBreakdown[];
  topProducts: ITopProduct[];
  recentTransactions: ISale[];
}
