export interface ITransferSourceOption {
  branchId: string
  branchName: string
  isActive: boolean
  currentQuantity: number
  lowStockThreshold: number | null
}
