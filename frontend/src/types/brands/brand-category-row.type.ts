/**
 * One category's sales within a single brand's drill-down. Derived through the
 * brand's products; `sharePct` is the category's share of the brand total.
 */
export interface IBrandCategoryRow {
  categoryId: string
  categoryName: string
  color: string | null
  units: number
  revenue: number
  profit: number
  transactions: number
  marginPct: number
  sharePct: number
}
