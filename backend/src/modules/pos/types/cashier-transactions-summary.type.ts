import { CashierPeriodStats } from '@pos/types/cashier-period-stats.type';
import { CashierTransactionRow } from '@pos/types/cashier-transaction-row.type';

export interface CashierTransactionsSummary {
  scope: 'cashier' | 'branch' | 'system';
  today: CashierPeriodStats;
  month: CashierPeriodStats;
  year: CashierPeriodStats;
  recentTransactions: CashierTransactionRow[];
}
