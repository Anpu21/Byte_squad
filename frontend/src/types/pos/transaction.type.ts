import type {
  TransactionType,
  DiscountType,
  PaymentMethod,
} from '@/constants/enums'

export interface ITransaction {
  id: string
  transactionNumber: string
  branchId: string
  cashierId: string
  type: TransactionType
  subtotal: number
  discountAmount: number
  discountType: DiscountType
  taxAmount: number
  total: number
  paymentMethod: PaymentMethod
  createdAt: string
}
