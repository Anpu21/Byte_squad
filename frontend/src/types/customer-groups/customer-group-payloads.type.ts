import type { CustomerGroupStatus } from '@/types/customer-groups/customer-group-status.type'
import type { CustomerOrderPaymentMode } from '@/types/customer-orders/customer-order-payment-mode.type'

export interface ICreateCustomerGroupPayload {
  name: string
}

export interface IJoinCustomerGroupPayload {
  joinCode: string
}

export interface IUpdateCustomerGroupPayload {
  name?: string
  status?: CustomerGroupStatus
}

export interface IAddGroupCartItemPayload {
  productId: string
  branchId: string
  unitId?: string
  quantity: number
  amount?: number
}

export interface ISetGroupCartItemQtyPayload {
  quantity: number
}

export interface ICheckoutGroupCartPayload {
  paymentMode?: CustomerOrderPaymentMode
  note?: string
}
