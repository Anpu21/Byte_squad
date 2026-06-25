/**
 * Backing data for the multi-line "Revenue Trend" (one line per branch).
 * Mirrors `DailyBreakdownByBranch` on the backend: `branches` drives the legend
 * + stable series→colour mapping (by index); each `days[].byBranch` is keyed by
 * `branchId` and zero-filled for every branch, so the chart wrapper can pivot
 * straight into Recharts rows.
 */
export interface IDailyBranchPoint {
    date: string;
    byBranch: Record<string, number>;
}

export interface IDailyBreakdownByBranch {
    branches: { branchId: string; branchName: string }[];
    days: IDailyBranchPoint[];
}
