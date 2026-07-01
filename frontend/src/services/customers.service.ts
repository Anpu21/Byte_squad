import api from './api'
import type {
  IApiResponse,
  ICustomerAnalytics,
  ICustomerProfileDetail,
  ICustomerProfileUpdate,
  ICustomersListRequest,
  ICustomersListResponse,
  IWalkInUpdate,
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

  update: async (
    key: string,
    payload: ICustomerProfileUpdate,
  ): Promise<ICustomerProfileDetail> => {
    const response = await api.patch<IApiResponse<ICustomerProfileDetail>>(
      `/customers/${encodeURIComponent(key)}`,
      payload,
    )
    return response.data.data
  },

  analytics: async (branchId?: string): Promise<ICustomerAnalytics> => {
    const response = await api.get<IApiResponse<ICustomerAnalytics>>(
      '/customers/analytics',
      { params: branchId ? { branchId } : undefined },
    )
    return response.data.data
  },

  // Edits a walk-in loyalty record (name/phone) via the loyalty module.
  updateWalkIn: async (
    loyaltyId: string,
    payload: IWalkInUpdate,
  ): Promise<void> => {
    await api.patch(`/loyalty/customers/${loyaltyId}`, payload)
  },
}
