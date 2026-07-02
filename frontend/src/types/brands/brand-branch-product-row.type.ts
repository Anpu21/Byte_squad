import type { IBrandBranchCell } from './brand-branch-row.type'

/**
 * One product of the drilled-in brand across every selected branch. `sharePct`
 * is share of the brand's selection-wide revenue.
 */
export interface IBrandBranchProductRow {
  productId: string
  productName: string
  units: number
  revenue: number
  profit: number
  marginPct: number
  sharePct: number
  perBranch: IBrandBranchCell[]
}
