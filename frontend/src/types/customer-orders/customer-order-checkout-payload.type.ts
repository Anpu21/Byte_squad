import type { CustomerOrderPaymentMode } from '@/types/customer-orders/customer-order-payment-mode.type'

export interface ICheckoutItemPayload {
  productId: string
  branchId: string
  unitId?: string
  quantity: number
  /**
   * "Buy by amount": firm cash for a loose line (e.g. 1000 Rs of bananas).
   * `quantity` is the derived weight; the server validates the two reconcile
   * and charges this amount exactly. Omit for normal by-weight / by-count lines.
   */
  amount?: number
}

/**
 * Multi-branch checkout payload. Each line carries its own branchId so the
 * cart can span branches; the server splits lines into one order per branch
 * under a shared group code.
 */
export interface ICheckoutPayload {
  items: ICheckoutItemPayload[]
  note?: string
  paymentMode?: CustomerOrderPaymentMode
  loyaltyPointsToRedeem?: number
}
