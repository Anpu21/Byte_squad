import type { IProductSellableUnit } from './product-sellable-unit.type'

export interface IProduct {
  id: string
  name: string
  barcode: string
  /** Numeric PLU/item code for weighed products (embedded in scale barcodes). */
  pluCode: string | null
  description: string | null
  category: string
  costPrice: number
  sellingPrice: number
  imageUrl: string | null
  baseUnit: string
  sellableUnits?: IProductSellableUnit[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
