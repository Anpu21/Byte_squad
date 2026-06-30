export interface IGroupCartItemView {
  id: string
  productId: string
  productName: string
  imageUrl: string | null
  branchId: string
  branchName: string
  unitId: string | null
  unitLabel: string
  unitPrice: number
  quantity: number
  /** Firm cash for a "buy by amount" line; null for normal lines. */
  amount: number | null
  lineTotal: number
  /** False when the product has been deactivated since it was added. */
  available: boolean
  addedByUserId: string
}
