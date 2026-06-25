import { Sale } from '@/modules/pos-sales/entities/sale.entity';
import { DailyBreakdown } from '@/modules/pos-sales/types/daily-breakdown.type';

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
