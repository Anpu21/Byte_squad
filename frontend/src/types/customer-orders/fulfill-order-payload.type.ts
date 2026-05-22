export interface IFulfillOrderPayload {
  paymentMethod?: 'cash' | 'card' | 'mobile'
  items?: { productId: string; quantity: number }[]
}
