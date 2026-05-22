import api from './api'
import type {
  IApiResponse,
  IStockTransferRequest,
  ITransferSourceOption,
  IPaginatedTransfers,
  ICreateAdminDirectTransferPayload,
  ICreateManagerBatchTransferPayload,
  IApproveTransferPayload,
  IListTransfersParams,
  IListTransferHistoryParams,
} from '@/types'

export const stockTransfersService = {
  // Admin-only multi-line direct shipment. Each cart line becomes a separate
  // StockTransferRequest written in APPROVED state in a single backend
  // transaction. Returns the list of created transfers.
  createAdminDirect: async (
    payload: ICreateAdminDirectTransferPayload,
  ): Promise<IStockTransferRequest[]> => {
    const response = await api.post<IApiResponse<IStockTransferRequest[]>>(
      '/stock-transfers/admin-direct',
      payload,
    )
    return response.data.data
  },

  // Manager multi-line request. Each cart line becomes a PENDING transfer
  // row destined for the manager's own branch in a single backend
  // transaction. Admin picks source + approves each one downstream.
  createManagerBatch: async (
    payload: ICreateManagerBatchTransferPayload,
  ): Promise<IStockTransferRequest[]> => {
    const response = await api.post<IApiResponse<IStockTransferRequest[]>>(
      '/stock-transfers/manager-batch',
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

