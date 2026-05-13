export interface BranchPerformance {
  branchId: string;
  branchName: string;
  isActive: boolean;
  todaySales: number;
  todayTransactions: number;
  staffCount: number;
  activeProducts: number;
  lowStockItems: number;
  managerName: string | null;
}
