import type { IComparisonTopProduct } from '@/types/admin/comparison-top-product.type'

export interface IBranchComparisonEntry {
  branchId: string
  branchName: string
  revenue: number
  expenses: number
  expenseRatio: number
  transactionCount: number
  avgTransactionValue: number
  staffCount: number
  revenuePerStaff: number
  topProducts: IComparisonTopProduct[]
}
