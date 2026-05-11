export interface IFulfillRequestPayload {
  paymentMethod: 'cash' | 'card' | 'mobile'
  items?: { productId: string; quantity: number }[]
}
