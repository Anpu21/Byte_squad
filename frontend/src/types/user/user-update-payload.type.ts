import type { UserRole } from '@/constants/enums'

export interface IUserUpdatePayload {
  email?: string
  firstName?: string
  lastName?: string
  role?: UserRole
  branchId?: string | null
  phone?: string | null
  address?: string | null
}
