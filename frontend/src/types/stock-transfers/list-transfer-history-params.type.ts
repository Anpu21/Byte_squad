import type { TransferStatus } from '@/constants/enums'

export interface IListTransferHistoryParams {
  status?: TransferStatus[]
  from?: string
  to?: string
  productId?: string
  branchId?: string
  page?: number
  limit?: number
}
