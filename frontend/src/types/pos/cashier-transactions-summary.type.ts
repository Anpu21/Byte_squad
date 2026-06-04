import type { ICashierPeriodStats } from './cashier-period-stats.type';
import type { ICashierTransactionRow } from './cashier-transaction-row.type';

/**
 * Response envelope for `GET /pos/my-transactions` and
 * `GET /pos/all-transactions`. `scope` lets the FE decide which columns to
 * render (e.g. `branch` shows the branch column, `system` adds cashier).
 *
 * Mirrors `backend/src/modules/pos/types/cashier-transactions-summary.type.ts`.
 */
export interface ICashierTransactionsSummary {
  scope: 'cashier' | 'branch' | 'system';
  today: ICashierPeriodStats;
  month: ICashierPeriodStats;
  year: ICashierPeriodStats;
  recentTransactions: ICashierTransactionRow[];
}
