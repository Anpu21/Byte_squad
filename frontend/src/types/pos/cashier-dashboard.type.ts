import type { IDailyBreakdown } from './daily-breakdown.type';
import type { ISale } from './sale.type';

/**
 * Response envelope for `GET /pos/my-dashboard` (cashier-scoped). Mirrors
 * `backend/src/modules/pos/types/cashier-dashboard-data.type.ts`.
 */
export interface ICashierDashboard {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  dailyBreakdown: IDailyBreakdown[];
  recentTransactions: ISale[];
}
