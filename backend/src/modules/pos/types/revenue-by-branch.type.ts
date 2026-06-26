/**
 * One slice of the "Revenue by Branch" donut: a branch's total sales over the
 * dashboard window. `branchName` is resolved server-side so the chart legend
 * never needs a follow-up lookup.
 */
export interface RevenueByBranch {
  branchId: string;
  branchName: string;
  total: number;
}
