import { MyBranchDailyPoint } from '@branches/types/my-branch-daily-point.type';

export interface MyBranchWeekKpis {
  sales: number;
  transactions: number;
  dailyBreakdown: MyBranchDailyPoint[];
}
