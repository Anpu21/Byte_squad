import type { IMyBranchInfo } from '@/types/branch/my-branch-info.type'
import type { IMyBranchAdmin } from '@/types/branch/my-branch-admin.type'
import type { IMyBranchTodayKpis } from '@/types/branch/my-branch-today-kpis.type'
import type { IMyBranchWeekKpis } from '@/types/branch/my-branch-week-kpis.type'
import type { IMyBranchMonthKpis } from '@/types/branch/my-branch-month-kpis.type'
import type { IMyBranchStaff } from '@/types/branch/my-branch-staff.type'
import type { IMyBranchInventory } from '@/types/branch/my-branch-inventory.type'
import type { IMyBranchTopProduct } from '@/types/branch/my-branch-top-product.type'
import type { IMyBranchLowStockItem } from '@/types/branch/my-branch-low-stock-item.type'
import type { IMyBranchRecentTransaction } from '@/types/branch/my-branch-recent-transaction.type'

export interface IMyBranchPerformance {
  branch: IMyBranchInfo
  admin: IMyBranchAdmin | null
  today: IMyBranchTodayKpis
  week: IMyBranchWeekKpis
  month: IMyBranchMonthKpis
  staff: IMyBranchStaff
  inventory: IMyBranchInventory
  topProducts: IMyBranchTopProduct[]
  lowStockList: IMyBranchLowStockItem[]
  recentTransactions: IMyBranchRecentTransaction[]
}
