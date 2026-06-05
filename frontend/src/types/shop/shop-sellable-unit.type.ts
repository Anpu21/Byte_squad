/**
 * Sellable unit returned by the storefront product API (mirrors the backend
 * `ShopSellableUnit`). `conversionToBase` converts the chosen unit's quantity
 * into the product base unit; `sellingPrice` is the price for one such unit.
 */
export interface IShopSellableUnit {
  id: string
  name: string
  isBase: boolean
  conversionToBase: number
  sellingPrice: number
  displayOrder: number
}
