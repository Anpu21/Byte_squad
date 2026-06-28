export interface IBrandAnalyticsParams {
  startDate: string
  endDate: string
  /** Admin only — filter to one branch. Omitted = all branches. */
  branchId?: string
}
