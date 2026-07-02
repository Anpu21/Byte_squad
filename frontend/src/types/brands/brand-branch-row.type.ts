/**
 * One row's numbers in one branch of the comparison — a branch with no sales
 * of the row's brand/product carries a genuine zero cell, never a gap.
 */
export interface IBrandBranchCell {
  branchId: string
  revenue: number
  units: number
  profit: number
}

/**
 * One brand across every selected branch. `brandId` null is the Unbranded
 * bucket. Totals span the whole selection; `sharePct` is share of the
 * selection-wide revenue. `perBranch` follows the response's branch order.
 */
export interface IBrandBranchRow {
  brandId: string | null
  brandName: string
  color: string | null
  units: number
  revenue: number
  profit: number
  transactions: number
  marginPct: number
  sharePct: number
  perBranch: IBrandBranchCell[]
}
