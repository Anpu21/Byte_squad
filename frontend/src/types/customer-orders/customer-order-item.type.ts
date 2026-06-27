export interface ICustomerOrderItem {
  id: string
  productId: string
  quantity: number
  unitPriceSnapshot: number
  /**
   * Firm line total for a "buy by amount" line; null for normal by-weight /
   * by-count lines (those cost unitPriceSnapshot × quantity).
   */
  fixedPriceOverride?: number | null
  product?: {
    id: string
    name: string
    imageUrl: string | null
  }
}
