import type { IUser } from '@/types/user/user.type'
import type { IShopBranch } from '@/types/shop/shop-branch.type'
import type { CustomerOrderStatus } from '@/types/customer-orders/customer-order-status.type'
import type { CustomerOrderPaymentMode } from '@/types/customer-orders/customer-order-payment-mode.type'
import type { CustomerOrderPaymentStatus } from '@/types/customer-orders/customer-order-payment-status.type'
import type { ICustomerOrderItem } from '@/types/customer-orders/customer-order-item.type'

export interface ICustomerOrder {
  id: string
  orderCode: string
  userId: string | null
  branchId: string
  branch?: IShopBranch
  user?: IUser | null
  status: CustomerOrderStatus
  estimatedTotal: number
  loyaltyDiscountAmount: number
  finalTotal: number
  paymentMode: CustomerOrderPaymentMode
  paymentStatus: CustomerOrderPaymentStatus
  loyaltyPointsRedeemed: number
  loyaltyPointsEarned: number
  guestName: string | null
  note: string | null
  fulfilledTransactionId: string | null
  qrCodeUrl: string | null
  items: ICustomerOrderItem[]
  createdAt: string
  updatedAt: string
}
