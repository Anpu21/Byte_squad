import type { UserActionType } from './user-action-type.type'

export interface IUserActionRequestResponse {
  actionId: string
  expiresAt: string
  action: UserActionType
}
