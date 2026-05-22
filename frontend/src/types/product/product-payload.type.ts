export interface IProductPayload {
  name: string
  barcode: string
  description?: string
  category: string
  costPrice: number
  sellingPrice: number
  imageUrl?: string
}
