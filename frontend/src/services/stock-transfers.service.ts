import api from './api'
import type {
  IApiResponse,
  IStockTransferRequest,
  ITransferSourceOption,
  IPaginatedTransfers,
  ICreateTransferPayload,
  IApproveTransferPayload,
  IListTransfersParams,
  IListTransferHistoryParams,
} from '@/types'

export const stockTransfersService = {
  create: async (
    payload: ICreateTransferPayload,
  ): Promise<IStockTransferRequest> => {
    const response = await api.post<IApiResponse<IStockTransferRequest>>(
      '/stock-transfers',
      payload,
    )
    return response.data.data
  },

  listAll: async (
    params?: IListTransfersParams,
  ): Promise<IPaginatedTransfers> => {
    const response = await api.get<IApiResponse<IPaginatedTransfers>>(
      '/stock-transfers',
      { params },
    )
    return response.data.data
  },

  listMyRequests: async (
    params?: IListTransfersParams,
  ): Promise<IPaginatedTransfers> => {
    const response = await api.get<IApiResponse<IPaginatedTransfers>>(
      '/stock-transfers/my-requests',
      { params },
    )
    return response.data.data
  },

  listIncoming: async (
    params?: IListTransfersParams,
  ): Promise<IPaginatedTransfers> => {
    const response = await api.get<IApiResponse<IPaginatedTransfers>>(
      '/stock-transfers/incoming',
      { params },
    )
    return response.data.data
  },

  getHistory: async (
    params?: IListTransferHistoryParams,
  ): Promise<IPaginatedTransfers> => {
    const response = await api.get<IApiResponse<IPaginatedTransfers>>(
      '/stock-transfers/history',
      { params },
    )
    return response.data.data
  },

  getById: async (id: string): Promise<IStockTransferRequest> => {
    const response = await api.get<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}`,
    )
    return response.data.data
  },

  getSourceOptions: async (
    id: string,
  ): Promise<ITransferSourceOption[]> => {
    const response = await api.get<
      IApiResponse<ITransferSourceOption[]>
    >(`/stock-transfers/${id}/source-options`)
    return response.data.data
  },

  approve: async (
    id: string,
    payload: IApproveTransferPayload,
  ): Promise<IStockTransferRequest> => {
    const response = await api.patch<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}/approve`,
      payload,
    )
    return response.data.data
  },

  reject: async (
    id: string,
    rejectionReason: string,
  ): Promise<IStockTransferRequest> => {
    const response = await api.patch<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}/reject`,
      { rejectionReason },
    )
    return response.data.data
  },

  cancel: async (id: string): Promise<IStockTransferRequest> => {
    const response = await api.patch<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}/cancel`,
    )
    return response.data.data
  },

  ship: async (id: string): Promise<IStockTransferRequest> => {
    const response = await api.patch<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}/ship`,
    )
    return response.data.data
  },

  receive: async (id: string): Promise<IStockTransferRequest> => {
    const response = await api.patch<IApiResponse<IStockTransferRequest>>(
      `/stock-transfers/${id}/receive`,
    )
    return response.data.data
  },
}
