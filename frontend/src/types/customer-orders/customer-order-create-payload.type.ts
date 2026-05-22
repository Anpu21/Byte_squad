import type { CustomerOrderPaymentMode } from '@/types/customer-orders/customer-order-payment-mode.type'

export interface ICustomerOrderCreatePayload {
  branchId: string
  items: { productId: string; quantity: number }[]
  note?: string
  paymentMode?: CustomerOrderPaymentMode
  loyaltyPointsToRedeem?: number
}
