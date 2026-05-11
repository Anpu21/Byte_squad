import type { IUser } from '@/types/user/user.type'

export interface IAuthResponse {
  accessToken: string
  user: IUser
}
