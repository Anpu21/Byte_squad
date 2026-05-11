import type { IDailyBreakdown } from '@/types/pos/daily-breakdown.type'
import type { ITopProduct } from '@/types/pos/top-product.type'
import type { ITransaction } from '@/types/pos/transaction.type'

export interface IAdminDashboard {
  today: {
    totalSales: number
    transactionCount: number
    averageSale: number
  }
  week: {
    totalSales: number
    transactionCount: number
  }
  month: {
    totalRevenue: number
    transactionCount: number
  }
  stats: {
    activeProducts: number
    lowStockItems: number
    totalUsers: number
    totalBranches: number
  }
  dailyBreakdown: IDailyBreakdown[]
  topProducts: ITopProduct[]
  recentTransactions: ITransaction[]
}
