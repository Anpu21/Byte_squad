/**
 * Backing data for the "Daily revenue" multi-line chart on the comparison
 * Summary view — one line per compared branch across the selected date range.
 *
 * `branches` follows the requested branch order (preserving the
 * branchId → palette-colour index mapping) and drives the legend. Each
 * `days[].byBranch` is keyed by `branchId` and zero-filled for every branch in
 * `branches`, so the chart pivots straight into Recharts rows without aligning
 * dates or guarding missing branch/day pairs.
 */
export interface IBranchAnalyticsTrendPoint {
  date: string
  byBranch: Record<string, number>
}

export interface IBranchAnalyticsTrend {
  branches: { branchId: string; branchName: string }[]
  days: IBranchAnalyticsTrendPoint[]
}
