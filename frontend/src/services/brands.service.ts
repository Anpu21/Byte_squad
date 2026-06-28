import api from './api'
import type {
  IApiResponse,
  IBrand,
  IBrandAnalyticsParams,
  IBrandOverviewResponse,
  IBrandDrilldownResponse,
} from '@/types'

export const brandsService = {
  list: async (includeInactive = false): Promise<IBrand[]> => {
    const response = await api.get<IApiResponse<IBrand[]>>('/brands', {
      params: includeInactive ? { includeInactive: true } : undefined,
    })
    return response.data.data
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
}
