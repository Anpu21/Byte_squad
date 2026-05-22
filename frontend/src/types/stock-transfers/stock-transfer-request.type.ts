import type { TransferStatus } from '@/constants/enums'
import type { IProduct } from '@/types/product/product.type'
import type { ITransferBranchSummary } from '@/types/stock-transfers/transfer-branch-summary.type'
import type { ITransferUserSummary } from '@/types/stock-transfers/transfer-user-summary.type'

export interface IStockTransferRequest {
  id: string
  batchId: string | null
  productId: string
  product: IProduct
  destinationBranchId: string
  destinationBranch: ITransferBranchSummary
  sourceBranchId: string | null
  sourceBranch: ITransferBranchSummary | null
  requestedQuantity: number
  approvedQuantity: number | null
  status: TransferStatus
  requestReason: string | null
  rejectionReason: string | null
  approvalNote: string | null
  requestedByUserId: string
  requestedBy: ITransferUserSummary
  reviewedByUserId: string | null
  reviewedBy: ITransferUserSummary | null
  reviewedAt: string | null
  shippedByUserId: string | null
  shippedBy: ITransferUserSummary | null
  shippedAt: string | null
  receivedByUserId: string | null
  receivedBy: ITransferUserSummary | null
  receivedAt: string | null
  createdAt: string
  updatedAt: string
}
