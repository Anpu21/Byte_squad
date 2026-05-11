import type { IBranchComparisonEntry } from '@/types/admin/branch-comparison-entry.type'

export interface IBranchComparisonResponse {
  startDate: string
  endDate: string
  branches: IBranchComparisonEntry[]
}
