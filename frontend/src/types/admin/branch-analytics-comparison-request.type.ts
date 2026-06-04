import type { BranchAnalyticsSection } from './branch-analytics-section.type'

export interface IBranchAnalyticsComparisonRequest {
  branchIds?: string[]
  startDate: string
  endDate: string
  sections?: BranchAnalyticsSection[]
}
