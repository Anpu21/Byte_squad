import type { CustomerOrderPaymentMode } from '@/types/customer-orders/customer-order-payment-mode.type'

export interface ICheckoutItemPayload {
  productId: string
  branchId: string
  unitId?: string
  quantity: number
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
