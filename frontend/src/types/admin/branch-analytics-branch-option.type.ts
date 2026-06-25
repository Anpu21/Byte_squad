/**
 * Minimal branch roster entry for the Branch Comparison picker. Returned by
 * `GET /branch-analytics/branches` for admins AND managers, so a manager can
 * choose which other branches to compare against (the full `/branches` list is
 * branch-scoped to their own branch).
 */
export interface IBranchAnalyticsBranchOption {
  id: string
  name: string
  isActive: boolean
}
