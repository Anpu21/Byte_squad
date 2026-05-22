import type { TransferStatus } from '@/constants/enums'

export interface IListTransfersParams {
  status?: TransferStatus
  destinationBranchId?: string
  sourceBranchId?: string
  page?: number
  limit?: number
}
