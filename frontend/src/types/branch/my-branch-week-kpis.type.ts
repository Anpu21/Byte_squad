import type { IMyBranchDailyPoint } from '@/types/branch/my-branch-daily-point.type'

export interface IMyBranchWeekKpis {
  sales: number
  transactions: number
  dailyBreakdown: IMyBranchDailyPoint[]
}
