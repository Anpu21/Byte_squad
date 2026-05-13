import type { IBranch } from '@/types/branch/branch.type'

export interface IBranchWithMeta extends IBranch {
  managerName: string | null
  managerEmail: string | null
  staffCount: number
}
