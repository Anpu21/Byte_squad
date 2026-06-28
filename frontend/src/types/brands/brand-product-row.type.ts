export interface IBrandProductRow {
  productId: string
  productName: string
  units: number
  revenue: number
  profit: number
  /** Profit margin %, 0–100 (one decimal). Approximate — uses current cost. */
  marginPct: number
  /** Revenue share of the brand total, 0–100 (one decimal). */
  sharePct: number
}
