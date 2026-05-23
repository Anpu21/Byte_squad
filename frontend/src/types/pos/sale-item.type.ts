import type { DiscountType } from '@/constants/enums'

export interface ISaleItem {
  id: string
  saleId: string
  productId: string
  quantity: number
  unitPrice: number
  discountAmount: number
  discountType: DiscountType
  lineTotal: number
}
