export interface ITransferAnalyticsParams {
  from?: string
  to?: string
  /** Admin only — scope to one branch. Ignored for managers. */
  branchId?: string
}
