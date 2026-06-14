export interface ICategorySalesRow {
  categoryId: string
  categoryName: string
  color: string | null
  units: number
  revenue: number
  transactions: number
  /** Revenue share of the window total, 0–100 (one decimal). */
  sharePct: number
}
