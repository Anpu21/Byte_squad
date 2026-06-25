/**
 * Backing data for the "Daily revenue" multi-line chart on the comparison
 * Summary view — one line per compared branch across the selected date range.
 *
 * `branches` is in the SAME order the caller requested (preserving the
 * branchId → palette-colour index mapping on the frontend) and drives the
 * legend. Each `days[].byBranch` is keyed by `branchId` and zero-filled for
 * every branch in `branches`, so the frontend pivots straight into Recharts
 * rows without aligning dates or guarding missing branch/day pairs.
 */
export interface BranchAnalyticsTrendPoint {
  date: string;
  byBranch: Record<string, number>;
}

export interface BranchAnalyticsTrend {
  branches: { branchId: string; branchName: string }[];
  days: BranchAnalyticsTrendPoint[];
}
