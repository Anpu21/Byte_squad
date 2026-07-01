import api from './api'
import type {
  IApiResponse,
  ICustomerProfileDetail,
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

  get: async (key: string): Promise<ICustomerProfileDetail> => {
    const response = await api.get<IApiResponse<ICustomerProfileDetail>>(
      `/customers/${encodeURIComponent(key)}`,
    )
    return response.data.data
  },
}
