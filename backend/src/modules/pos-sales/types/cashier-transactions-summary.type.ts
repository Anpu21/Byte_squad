import { CashierPeriodStats } from '@/modules/pos-sales/types/cashier-period-stats.type';
import { CashierTransactionRow } from '@/modules/pos-sales/types/cashier-transaction-row.type';

export interface CashierTransactionsSummary {
  scope: 'cashier' | 'branch' | 'system';
  today: CashierPeriodStats;
  month: CashierPeriodStats;
  year: CashierPeriodStats;
  recentTransactions: CashierTransactionRow[];
}
