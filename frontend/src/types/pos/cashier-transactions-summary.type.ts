import type { ICashierPeriodStats } from '@/types/pos/cashier-period-stats.type'
import type { ICashierTransactionRow } from '@/types/pos/cashier-transaction-row.type'

export interface ICashierTransactionsSummary {
  scope: 'cashier' | 'branch' | 'system'
  today: ICashierPeriodStats
  month: ICashierPeriodStats
  year: ICashierPeriodStats
  recentTransactions: ICashierTransactionRow[]
}
