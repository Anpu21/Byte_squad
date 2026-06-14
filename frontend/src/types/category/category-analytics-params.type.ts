export interface ICategoryAnalyticsParams {
  startDate: string
  endDate: string
  /** Admin only — filter to one branch. Omitted = all branches. */
  branchId?: string
}
