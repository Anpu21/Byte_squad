import type { IOverviewSummary } from '@/types/admin/overview-summary.type'
import type { IBranchPerformance } from '@/types/admin/branch-performance.type'
import type { IOverviewAlert } from '@/types/admin/overview-alert.type'

export interface IOverviewResponse {
  summary: IOverviewSummary
  branches: IBranchPerformance[]
  alerts: IOverviewAlert[]
}
