import type { IInventoryMatrixCell } from '@/types/admin/inventory-matrix-cell.type'

export interface IInventoryMatrixRow {
  productId: string
  productName: string
  barcode: string
  category: string
  baseUnit: string
  sellingPrice: number
  cells: IInventoryMatrixCell[]
  totalQuantity: number
}
