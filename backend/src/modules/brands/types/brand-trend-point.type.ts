/** One day on a brand's revenue/units trend line (zero-filled by the service). */
export interface BrandTrendPoint {
  date: string; // YYYY-MM-DD
  revenue: number;
  units: number;
}
