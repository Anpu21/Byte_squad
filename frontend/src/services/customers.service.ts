import api from './api'
import type {
  IApiResponse,
  ICustomersListRequest,
  ICustomersListResponse,
} from '@/types'

export const customerService = {
  list: async (
    params: ICustomersListRequest,
  ): Promise<ICustomersListResponse> => {
    const response = await api.get<IApiResponse<ICustomersListResponse>>(
      '/customers',
      { params },
    )
    return response.data.data
  },
}
