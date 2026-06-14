import type { ShipmentStatus } from '@/constants/enums'

export interface IListShipmentsParams {
  status?: ShipmentStatus
  branchId?: string
  page?: number
  limit?: number
}
