import { MyBranchInfo } from '@branches/types/my-branch-info.type';
import { MyBranchAdmin } from '@branches/types/my-branch-admin.type';
import { MyBranchTodayKpis } from '@branches/types/my-branch-today-kpis.type';
import { MyBranchWeekKpis } from '@branches/types/my-branch-week-kpis.type';
import { MyBranchMonthKpis } from '@branches/types/my-branch-month-kpis.type';
import { MyBranchStaff } from '@branches/types/my-branch-staff.type';
import { MyBranchInventory } from '@branches/types/my-branch-inventory.type';
import { MyBranchTopProduct } from '@branches/types/my-branch-top-product.type';
import { MyBranchLowStockItem } from '@branches/types/my-branch-low-stock-item.type';
import { MyBranchRecentTransaction } from '@branches/types/my-branch-recent-transaction.type';

export interface MyBranchPerformance {
  branch: MyBranchInfo;
  admin: MyBranchAdmin | null;
  today: MyBranchTodayKpis;
  week: MyBranchWeekKpis;
  month: MyBranchMonthKpis;
  staff: MyBranchStaff;
  inventory: MyBranchInventory;
  topProducts: MyBranchTopProduct[];
  lowStockList: MyBranchLowStockItem[];
  recentTransactions: MyBranchRecentTransaction[];
}
