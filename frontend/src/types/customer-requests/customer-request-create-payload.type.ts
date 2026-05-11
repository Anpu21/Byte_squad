export interface ICustomerRequestCreatePayload {
  branchId: string
  items: { productId: string; quantity: number }[]
  note?: string
}
