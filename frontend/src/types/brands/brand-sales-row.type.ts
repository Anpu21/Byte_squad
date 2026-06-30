export interface IBrandSalesRow {
  brandId: string
  brandName: string
  color: string | null
  units: number
  revenue: number
  profit: number
  /** Profit margin %, 0–100 (one decimal). Approximate — uses current cost. */
  marginPct: number
  transactions: number
  /** Revenue share of the window total, 0–100 (one decimal). */
  sharePct: number
}
