import api from './api'
import type {
  IApiResponse,
  IBrand,
  IBrandAnalyticsParams,
  IBrandOverviewResponse,
  IBrandDrilldownResponse,
  IBrandBranchComparisonRequest,
  IBrandBranchComparisonResponse,
  IBrandBranchProductsRequest,
  IBrandBranchProductsResponse,
  IBrandBranchTrendRequest,
  IBrandBranchTrendResponse,
  ICreateBrandPayload,
  IUpdateBrandPayload,
  ICategoryBrandComparisonResponse,
  ICategoryProductsResponse,
  ICategoryProductsParams,
} from '@/types'

export const brandsService = {
  list: async (includeInactive = false): Promise<IBrand[]> => {
    const response = await api.get<IApiResponse<IBrand[]>>('/brands', {
      params: includeInactive ? { includeInactive: true } : undefined,
    })
    return response.data.data
  },

  get: async (id: string): Promise<IBrand> => {
    const response = await api.get<IApiResponse<IBrand>>(`/brands/${id}`)
    return response.data.data
  },

  create: async (payload: ICreateBrandPayload): Promise<IBrand> => {
    const response = await api.post<IApiResponse<IBrand>>('/brands', payload)
    return response.data.data
  },

  update: async (id: string, payload: IUpdateBrandPayload): Promise<IBrand> => {
    const response = await api.patch<IApiResponse<IBrand>>(
      `/brands/${id}`,
      payload,
    )
    return response.data.data
  },

  archive: async (id: string): Promise<IBrand> => {
    const response = await api.patch<IApiResponse<IBrand>>(
      `/brands/${id}/archive`,
    )
    return response.data.data
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/brands/${id}`)
  },

  getOverview: async (
    params: IBrandAnalyticsParams,
  ): Promise<IBrandOverviewResponse> => {
    const response = await api.get<IApiResponse<IBrandOverviewResponse>>(
      '/brands/analytics/overview',
      { params },
    )
    return response.data.data
  },

  getBrandAnalytics: async (
    brandId: string,
    params: IBrandAnalyticsParams,
  ): Promise<IBrandDrilldownResponse> => {
    const response = await api.get<IApiResponse<IBrandDrilldownResponse>>(
      `/brands/analytics/${brandId}`,
      { params },
    )
    return response.data.data
  },

  getCategoryComparison: async (
    categoryId: string,
    params: IBrandAnalyticsParams,
  ): Promise<ICategoryBrandComparisonResponse> => {
    const response = await api.get<
      IApiResponse<ICategoryBrandComparisonResponse>
    >(`/brands/analytics/by-category/${categoryId}`, { params })
    return response.data.data
  },

  getCategoryProducts: async (
    categoryId: string,
    params: ICategoryProductsParams,
  ): Promise<ICategoryProductsResponse> => {
    const response = await api.get<IApiResponse<ICategoryProductsResponse>>(
      `/brands/analytics/by-category/${categoryId}/products`,
      { params },
    )
    return response.data.data
  },

  getBranchComparison: async (
    request: IBrandBranchComparisonRequest,
  ): Promise<IBrandBranchComparisonResponse> => {
    const response = await api.post<
      IApiResponse<IBrandBranchComparisonResponse>
    >('/brands/analytics/by-branch', request)
    return response.data.data
  },

  getBranchProducts: async (
    request: IBrandBranchProductsRequest,
  ): Promise<IBrandBranchProductsResponse> => {
    const response = await api.post<IApiResponse<IBrandBranchProductsResponse>>(
      '/brands/analytics/by-branch/products',
      request,
    )
    return response.data.data
  },

  getBranchTrend: async (
    request: IBrandBranchTrendRequest,
  ): Promise<IBrandBranchTrendResponse> => {
    const response = await api.post<IApiResponse<IBrandBranchTrendResponse>>(
      '/brands/analytics/by-branch/trend',
      request,
    )
    return response.data.data
  },
}
