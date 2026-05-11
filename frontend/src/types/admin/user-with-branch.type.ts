import type { UserRole } from '@/constants/enums'

export interface IUserWithBranch {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  branchId: string
  branchName: string | null
  isVerified: boolean
  lastLoginAt: string | null
  createdAt: string
}
