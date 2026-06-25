import type { UserRole } from '@/constants/enums'
import type { AppLanguage } from '@/i18n/config'

export interface IUser {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  role: UserRole
  branchId: string | null
  phone?: string | null
  address?: string | null
  /** Preferred UI language, persisted from profile settings. */
  language?: AppLanguage
  isFirstLogin: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}
