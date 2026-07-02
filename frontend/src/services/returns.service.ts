import api from './api'
import type {
  IApiResponse,
  ICreateSalesReturnPayload,
  IPaginatedSalesReturns,
  IReturnsAnalytics,
  IReturnsAnalyticsParams,
  IReturnsParams,
  ISaleReturnLookup,
  ISalesReturn,
} from '@/types'

export const returnsService = {
  lookup: async (invoiceNumber: string): Promise<ISaleReturnLookup> => {
    const response = await api.get<IApiResponse<ISaleReturnLookup>>(
      '/returns/lookup',
      { params: { invoiceNumber } },
    )
    return response.data.data
  },

  create: async (
    payload: ICreateSalesReturnPayload,
  ): Promise<ISalesReturn> => {
    const response = await api.post<IApiResponse<ISalesReturn>>(
      '/returns',
      payload,
    )
    return response.data.data
  },

  list: async (
    params?: IReturnsParams,
  ): Promise<IPaginatedSalesReturns> => {
    const response = await api.get<IApiResponse<IPaginatedSalesReturns>>(
      '/returns',
      { params },
    )
    return response.data.data
  },

  getAnalytics: async (
    params?: IReturnsAnalyticsParams,
  ): Promise<IReturnsAnalytics> => {
    const response = await api.get<IApiResponse<IReturnsAnalytics>>(
      '/returns/analytics',
      { params },
    )
    return response.data.data
  },
}
