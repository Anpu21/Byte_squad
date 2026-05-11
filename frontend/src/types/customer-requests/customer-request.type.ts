import type { IUser } from '@/types/user/user.type'
import type { IShopBranch } from '@/types/shop/shop-branch.type'
import type { CustomerRequestStatus } from '@/types/customer-requests/customer-request-status.type'
import type { ICustomerRequestItem } from '@/types/customer-requests/customer-request-item.type'

export interface ICustomerRequest {
  id: string
  requestCode: string
  userId: string | null
  branchId: string
  branch?: IShopBranch
  user?: IUser | null
  status: CustomerRequestStatus
  estimatedTotal: number
  guestName: string | null
  note: string | null
  fulfilledTransactionId: string | null
  qrCodeUrl: string | null
  items: ICustomerRequestItem[]
  createdAt: string
  updatedAt: string
}
