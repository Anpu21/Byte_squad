import type { IManagerBatchTransferLine } from './manager-batch-transfer-line.type'

export interface ICreateManagerBatchTransferPayload {
  requestReason: string
  lines: IManagerBatchTransferLine[]
}
