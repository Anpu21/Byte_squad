/**
 * One row's numbers in one branch of the comparison. A branch with no sales of
 * the row's brand/product gets a genuine zero cell rather than being dropped.
 */
export interface BrandBranchCell {
  branchId: string;
  revenue: number;
  units: number;
  profit: number;
}
