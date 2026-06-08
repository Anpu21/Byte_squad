import type { IProductSellableUnit } from './product-sellable-unit.type'

export interface IProduct {
  id: string
  name: string
  barcode: string
  description: string | null
  category: string
  costPrice: number
  sellingPrice: number
  mrp?: number | null
  imageUrl: string | null
  baseUnit: string
  sellableUnits?: IProductSellableUnit[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
