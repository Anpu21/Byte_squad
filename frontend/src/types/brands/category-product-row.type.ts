/** One brand-tagged product in a category's roster (null brand = unbranded). */
export interface ICategoryProductRow {
  productId: string
  productName: string
  brandId: string | null
  brandName: string | null
  color: string | null
  units: number
  revenue: number
  profit: number
  marginPct: number
  sharePct: number
}
