export interface ICustomerRequestItem {
  id: string
  productId: string
  quantity: number
  unitPriceSnapshot: number
  product?: {
    id: string
    name: string
    imageUrl: string | null
  }
}
