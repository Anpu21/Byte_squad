/**
 * One slice of the "Revenue by Branch" donut. Mirrors `RevenueByBranch` on the
 * backend; `branchName` is resolved server-side for the legend.
 */
export interface IRevenueByBranch {
    branchId: string;
    branchName: string;
    total: number;
}
