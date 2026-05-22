export interface IProduct {
  id: string
  name: string
  barcode: string
  description: string | null
  category: string
  costPrice: number
  sellingPrice: number
  imageUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
