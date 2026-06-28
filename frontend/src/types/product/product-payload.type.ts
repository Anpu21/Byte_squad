/**
 * Wire shape for a sellable-unit row on the create/update product payload.
 * Matches the backend `SellableUnitDto`: numeric `conversionToBase`, plain
 * `displayOrder` integer. The UI-only `rowId` stays in the editor and
 * never lands here.
 */
export interface ISellableUnitPayload {
  name: string
  barcode?: string | null
  isBase: boolean
  conversionToBase: number
  sellingPrice: number
  displayOrder: number
}

/**
 * Allow-list of base units accepted by the create/update product API.
 * Mirrors `SUPPORTED_BASE_UNITS_FE` in the product-form feature; both
 * tables ultimately track `backend/src/modules/products/lib/default-sellable-units.ts`.
 */
export type TProductBaseUnit =
  | 'kg'
  | 'l'
  | 'unit'

export interface IProductPayload {
  name: string
  barcode: string
  /** Numeric PLU/item code for weighed products; omit/null when not weighed. */
  pluCode?: string | null
  description?: string
  category: string
  brand?: string
  costPrice: number
  sellingPrice: number
  imageUrl?: string
  baseUnit?: TProductBaseUnit
  sellableUnits?: ISellableUnitPayload[]
}
