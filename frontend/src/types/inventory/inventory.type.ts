export interface IInventory {
  id: string
  productId: string
  branchId: string
  quantity: number
  lowStockThreshold: number
  lastRestockedAt: string | null
  updatedAt: string
}
