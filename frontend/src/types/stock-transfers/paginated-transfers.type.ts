import type { IStockTransferRequest } from '@/types/stock-transfers/stock-transfer-request.type'

export interface IPaginatedTransfers {
  items: IStockTransferRequest[]
  total: number
  page: number
  limit: number
  totalPages: number
}
