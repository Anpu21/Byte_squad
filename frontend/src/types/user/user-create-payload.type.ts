import type { UserRole } from '@/constants/enums'

export interface IUserCreatePayload {
  email: string
  firstName: string
  lastName: string
  role: UserRole
  branchId: string
  phone?: string | null
  address?: string | null
}
