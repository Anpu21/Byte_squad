import type { IShipment } from '@/types/shipments/shipment.type'

export interface IPaginatedShipments {
  items: IShipment[]
  total: number
  page: number
  limit: number
  totalPages: number
}
