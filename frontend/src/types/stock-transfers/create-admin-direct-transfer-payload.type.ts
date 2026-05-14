import type { IAdminDirectTransferLine } from './admin-direct-transfer-line.type'

export interface ICreateAdminDirectTransferPayload {
  sourceBranchId: string
  destinationBranchId: string
  approvalNote?: string
  lines: IAdminDirectTransferLine[]
}
