export interface IBranchPerformance {
  branchId: string
  branchName: string
  isActive: boolean
  todaySales: number
  todayTransactions: number
  staffCount: number
  activeProducts: number
  lowStockItems: number
  adminName: string | null
}
