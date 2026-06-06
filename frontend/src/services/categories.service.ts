import api from './api'
import type {
  IApiResponse,
  ICategory,
  ICategoryAnalyticsParams,
  ICategoryAnalyticsResponse,
  ICreateCategoryPayload,
  IUpdateCategoryPayload,
} from '@/types'

export const categoriesService = {
  list: async (includeInactive = false): Promise<ICategory[]> => {
    const response = await api.get<IApiResponse<ICategory[]>>('/categories', {
      params: includeInactive ? { includeInactive: true } : undefined,
    })
    return response.data.data
  },

  create: async (payload: ICreateCategoryPayload): Promise<ICategory> => {
    const response = await api.post<IApiResponse<ICategory>>(
      '/categories',
      payload,
    )
    return response.data.data
  },

  update: async (
    id: string,
    payload: IUpdateCategoryPayload,
  ): Promise<ICategory> => {
    const response = await api.patch<IApiResponse<ICategory>>(
      `/categories/${id}`,
      payload,
    )
    return response.data.data
  },

  archive: async (id: string): Promise<ICategory> => {
    const response = await api.patch<IApiResponse<ICategory>>(
      `/categories/${id}/archive`,
    )
    return response.data.data
  },

  getAnalytics: async (
    params: ICategoryAnalyticsParams,
  ): Promise<ICategoryAnalyticsResponse> => {
    const response = await api.get<IApiResponse<ICategoryAnalyticsResponse>>(
      '/categories/analytics',
      { params },
    )
    return response.data.data
  },
}
