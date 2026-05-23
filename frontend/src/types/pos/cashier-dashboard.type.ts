import type { IDailyBreakdown } from '@/types/pos/daily-breakdown.type'
import type { ISale } from '@/types/pos/sale.type'

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
  recentTransactions: ISale[]
}
