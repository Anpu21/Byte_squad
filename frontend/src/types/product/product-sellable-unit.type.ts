/**
 * Persisted sellable-unit row for a product, as returned alongside
 * {@link IProduct} when the API includes the relation. Mirrors the backend
 * `ProductSellableUnit` entity columns (without typeorm decorations).
 *
 * The cashier UI uses the lighter-weight `IProductUnitRow` (under
 * `@/types/pos`) when fetching units in isolation. This shape is used
 * wherever a loaded product carries its full unit list, e.g. when the
 * product-form editor seeds itself from an existing product.
 */
export interface IProductSellableUnit {
  id: string
  productId: string
  name: string
  barcode: string | null
  isBase: boolean
  conversionToBase: number
  sellingPrice: number
  displayOrder: number
}
