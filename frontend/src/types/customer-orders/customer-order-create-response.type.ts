import type { ICustomerOrder } from '@/types/customer-orders/customer-order.type'
import type { IPayhereCheckoutPayload } from '@/types/customer-orders/payhere-checkout.type'

export interface ICustomerOrderCreateResponse {
  order: ICustomerOrder
  payment: IPayhereCheckoutPayload | null
}
