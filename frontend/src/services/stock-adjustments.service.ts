import api from './api'
import type {
  IApiResponse,
  ICreateStockAdjustmentPayload,
  IPaginatedStockAdjustments,
  IStockAdjustment,
  IStockAdjustmentsParams,
} from '@/types'

export const stockAdjustmentsService = {
  create: async (
    payload: ICreateStockAdjustmentPayload,
  ): Promise<IStockAdjustment> => {
    const response = await api.post<IApiResponse<IStockAdjustment>>(
      '/stock-adjustments',
      payload,
    )
    return response.data.data
  },

  list: async (
    params?: IStockAdjustmentsParams,
  ): Promise<IPaginatedStockAdjustments> => {
    const response = await api.get<IApiResponse<IPaginatedStockAdjustments>>(
      '/stock-adjustments',
      { params },
    )
    return response.data.data
  },

  approve: async (id: string): Promise<IStockAdjustment> => {
    const response = await api.patch<IApiResponse<IStockAdjustment>>(
      `/stock-adjustments/${id}/approve`,
    )
    return response.data.data
  },

  reverse: async (id: string): Promise<IStockAdjustment> => {
    const response = await api.patch<IApiResponse<IStockAdjustment>>(
      `/stock-adjustments/${id}/reverse`,
    )
    return response.data.data
  },
}
