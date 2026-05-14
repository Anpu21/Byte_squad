import type { IUser } from './user.type'
import type { UserActionType } from './user-action-type.type'

export interface IUserActionConfirmResponse {
  action: UserActionType
  user: IUser | null
}
