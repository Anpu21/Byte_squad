import type { IBranch } from '@/types/branch/branch.type'

export interface IBranchWithMeta extends IBranch {
  adminName: string | null
  adminEmail: string | null
  staffCount: number
}
