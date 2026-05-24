import { Sale } from '@pos/entities/sale.entity';
import { DailyBreakdown } from '@pos/types/daily-breakdown.type';

export interface CashierDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  dailyBreakdown: DailyBreakdown[];
  recentTransactions: Sale[];
}
