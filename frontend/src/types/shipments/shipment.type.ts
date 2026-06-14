import type { ShipmentStatus } from '@/constants/enums'
import type { IStockTransferRequest } from '@/types/stock-transfers/stock-transfer-request.type'
import type { ITransferBranchSummary } from '@/types/stock-transfers/transfer-branch-summary.type'
import type { IShipmentEvent } from '@/types/shipments/shipment-event.type'
import type { IShipmentCourierSummary } from '@/types/shipments/shipment-courier-summary.type'

/** A courier parcel grouping approved transfer lines from one branch to another. */
export interface IShipment {
  id: string
  trackingRef: string
  batchId: string | null
  sourceBranchId: string
  sourceBranch: ITransferBranchSummary
  destinationBranchId: string
  destinationBranch: ITransferBranchSummary
  status: ShipmentStatus
  courierEmployeeId: string | null
  courier: IShipmentCourierSummary | null
  eta: string | null
  exceptionReason: string | null
  dispatchedAt: string | null
  deliveredAt: string | null
  returnedAt: string | null
  cancelledAt: string | null
  lines: IStockTransferRequest[]
  events: IShipmentEvent[]
  createdAt: string
  updatedAt: string
}
