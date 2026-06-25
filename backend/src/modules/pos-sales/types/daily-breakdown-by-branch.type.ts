/**
 * Backing data for the multi-line "Revenue Trend" chart (one line per branch).
 *
 * `branches` drives the legend AND the stable series→colour mapping (by index);
 * each `days[].byBranch` is keyed by `branchId` and is zero-filled for every
 * branch in `branches`, so the frontend can pivot directly into Recharts rows
 * without aligning dates or guarding for missing branch/day pairs.
 */
export interface DailyBranchPoint {
  date: string;
  byBranch: Record<string, number>;
}

export interface DailyBreakdownByBranch {
  branches: { branchId: string; branchName: string }[];
  days: DailyBranchPoint[];
}
