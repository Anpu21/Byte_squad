import type { IUser } from '@/types/user/user.type'
import type { IBranch } from '@/types/branch/branch.type'

export interface IUserProfile extends IUser {
  branch?: IBranch
}
