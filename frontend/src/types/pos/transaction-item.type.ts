import type { DiscountType } from '@/constants/enums'

export interface ITransactionItem {
  id: string
  transactionId: string
  productId: string
  quantity: number
  unitPrice: number
  discountAmount: number
  discountType: DiscountType
  lineTotal: number
}
