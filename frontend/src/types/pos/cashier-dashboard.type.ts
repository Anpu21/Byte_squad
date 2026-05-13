import type { IDailyBreakdown } from '@/types/pos/daily-breakdown.type'
import type { ITransaction } from '@/types/pos/transaction.type'

export interface ICashierDashboard {
  today: {
    totalSales: number
    transactionCount: number
    averageSale: number
  }
  week: {
    totalSales: number
    transactionCount: number
  }
  dailyBreakdown: IDailyBreakdown[]
  recentTransactions: ITransaction[]
}
