import api from './api'
import type {
  IApiResponse,
  ICustomerGroupSummary,
  ICustomerGroupDetail,
  IGroupCartView,
  IGroupAnalyticsParams,
  IGroupAnalyticsResponse,
  ICreateCustomerGroupPayload,
  IJoinCustomerGroupPayload,
  IUpdateCustomerGroupPayload,
  IAddGroupCartItemPayload,
  ISetGroupCartItemQtyPayload,
  ICheckoutGroupCartPayload,
  ICheckoutResponse,
} from '@/types'

const BASE = '/customer-groups'

export const customerGroupsService = {
  // ── Groups + membership ──────────────────────────────────
  listMine: async (): Promise<ICustomerGroupSummary[]> => {
    const response = await api.get<IApiResponse<ICustomerGroupSummary[]>>(
      `${BASE}/mine`,
    )
    return response.data.data
  },

  getById: async (id: string): Promise<ICustomerGroupDetail> => {
    const response = await api.get<IApiResponse<ICustomerGroupDetail>>(
      `${BASE}/${id}`,
    )
    return response.data.data
  },

  create: async (
    payload: ICreateCustomerGroupPayload,
  ): Promise<ICustomerGroupDetail> => {
    const response = await api.post<IApiResponse<ICustomerGroupDetail>>(
      BASE,
      payload,
    )
    return response.data.data
  },

  join: async (
    payload: IJoinCustomerGroupPayload,
  ): Promise<ICustomerGroupDetail> => {
    const response = await api.post<IApiResponse<ICustomerGroupDetail>>(
      `${BASE}/join`,
      payload,
    )
    return response.data.data
  },

  update: async (
    id: string,
    payload: IUpdateCustomerGroupPayload,
  ): Promise<ICustomerGroupDetail> => {
    const response = await api.patch<IApiResponse<ICustomerGroupDetail>>(
      `${BASE}/${id}`,
      payload,
    )
    return response.data.data
  },

  regenerateCode: async (id: string): Promise<ICustomerGroupDetail> => {
    const response = await api.post<IApiResponse<ICustomerGroupDetail>>(
      `${BASE}/${id}/regenerate-code`,
    )
    return response.data.data
  },

  leave: async (id: string): Promise<void> => {
    await api.post(`${BASE}/${id}/leave`)
  },

  removeMember: async (
    id: string,
    userId: string,
  ): Promise<ICustomerGroupDetail> => {
    const response = await api.delete<IApiResponse<ICustomerGroupDetail>>(
      `${BASE}/${id}/members/${userId}`,
    )
    return response.data.data
  },

  // ── Shared cart ──────────────────────────────────────────
  getCart: async (id: string): Promise<IGroupCartView> => {
    const response = await api.get<IApiResponse<IGroupCartView>>(
      `${BASE}/${id}/cart`,
    )
    return response.data.data
  },

  addCartItem: async (
    id: string,
    payload: IAddGroupCartItemPayload,
  ): Promise<IGroupCartView> => {
    const response = await api.post<IApiResponse<IGroupCartView>>(
      `${BASE}/${id}/cart`,
      payload,
    )
    return response.data.data
  },

  setCartItemQty: async (
    id: string,
    itemId: string,
    payload: ISetGroupCartItemQtyPayload,
  ): Promise<IGroupCartView> => {
    const response = await api.patch<IApiResponse<IGroupCartView>>(
      `${BASE}/${id}/cart/${itemId}`,
      payload,
    )
    return response.data.data
  },

  removeCartItem: async (
    id: string,
    itemId: string,
  ): Promise<IGroupCartView> => {
    const response = await api.delete<IApiResponse<IGroupCartView>>(
      `${BASE}/${id}/cart/${itemId}`,
    )
    return response.data.data
  },

  clearCart: async (id: string): Promise<IGroupCartView> => {
    const response = await api.delete<IApiResponse<IGroupCartView>>(
      `${BASE}/${id}/cart`,
    )
    return response.data.data
  },

  // ── Checkout + analytics ─────────────────────────────────
  checkout: async (
    id: string,
    payload: ICheckoutGroupCartPayload,
  ): Promise<ICheckoutResponse> => {
    const response = await api.post<IApiResponse<ICheckoutResponse>>(
      `${BASE}/${id}/checkout`,
      payload,
    )
    return response.data.data
  },

  getAnalytics: async (
    id: string,
    params: IGroupAnalyticsParams,
  ): Promise<IGroupAnalyticsResponse> => {
    const response = await api.get<IApiResponse<IGroupAnalyticsResponse>>(
      `${BASE}/${id}/analytics`,
      { params },
    )
    return response.data.data
  },
}
