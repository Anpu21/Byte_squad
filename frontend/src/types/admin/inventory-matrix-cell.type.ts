export interface IInventoryMatrixCell {
  branchId: string
  inventoryId: string | null
  quantity: number
  lowStockThreshold: number | null
  isLowStock: boolean
  isOutOfStock: boolean
  lastRestockedAt: string | null
}
