/**
 * One brand's sales within a category — the "same category, different brands"
 * row. `brandId` is null for the Unbranded bucket. `sharePct` is share of the
 * category total.
 */
export interface ICategoryBrandRow {
  brandId: string | null
  brandName: string
  color: string | null
  units: number
  revenue: number
  profit: number
  transactions: number
  marginPct: number
  sharePct: number
}
