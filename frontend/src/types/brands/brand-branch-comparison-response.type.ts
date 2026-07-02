import type { IBrandBranchRow } from './brand-branch-row.type'

/** One branch column of the comparison, echoed in resolved order. */
export interface IBrandBranchOption {
  branchId: string
  branchName: string
}

/** Brand×branch comparison — every brand's sales per selected branch. */
export interface IBrandBranchComparisonResponse {
  branches: IBrandBranchOption[]
  startDate: string
  endDate: string
  totalRevenue: number
  totalUnits: number
  totalProfit: number
  totalTransactions: number
  marginPct: number
  rows: IBrandBranchRow[]
}
