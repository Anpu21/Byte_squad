import type { UserRole } from '@/constants/enums'

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: UserRole
  branchId: string | null
  phone?: string | null
  isFirstLogin: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}
