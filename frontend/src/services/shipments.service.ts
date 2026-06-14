import api from './api'
import type {
  IApiResponse,
  IShipment,
  IPaginatedShipments,
  ICreateShipmentPayload,
  IAssignCourierPayload,
  IShipmentCheckpointPayload,
  IListShipmentsParams,
} from '@/types'

export const shipmentsService = {
  list: async (
    params?: IListShipmentsParams,
  ): Promise<IPaginatedShipments> => {
    const response = await api.get<IApiResponse<IPaginatedShipments>>(
      '/shipments',
      { params },
    )
    return response.data.data
  },

  getById: async (id: string): Promise<IShipment> => {
    const response = await api.get<IApiResponse<IShipment>>(`/shipments/${id}`)
    return response.data.data
  },

  create: async (payload: ICreateShipmentPayload): Promise<IShipment> => {
    const response = await api.post<IApiResponse<IShipment>>(
      '/shipments',
      payload,
    )
    return response.data.data
  },

  assignCourier: async (
    id: string,
    payload: IAssignCourierPayload,
  ): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/assign-courier`,
      payload,
    )
    return response.data.data
  },

  dispatch: async (id: string): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/dispatch`,
    )
    return response.data.data
  },

  checkpoint: async (
    id: string,
    payload: IShipmentCheckpointPayload,
  ): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/checkpoint`,
      payload,
    )
    return response.data.data
  },

  outForDelivery: async (id: string): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/out-for-delivery`,
    )
    return response.data.data
  },

  deliver: async (id: string): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/deliver`,
    )
    return response.data.data
  },

  returnShipment: async (id: string, reason: string): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/return`,
      { reason },
    )
    return response.data.data
  },

  cancel: async (id: string, reason: string): Promise<IShipment> => {
    const response = await api.patch<IApiResponse<IShipment>>(
      `/shipments/${id}/cancel`,
      { reason },
    )
    return response.data.data
  },
}
