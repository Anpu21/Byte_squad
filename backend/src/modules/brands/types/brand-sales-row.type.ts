/**
 * One brand's aggregated sales for the analytics leaderboard. `marginPct` and
 * `sharePct` are derived by the service against the window total; the repository
 * returns them as 0.
 */
export interface BrandSalesRow {
  brandId: string;
  brandName: string;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  marginPct: number;
  transactions: number;
  sharePct: number;
}
