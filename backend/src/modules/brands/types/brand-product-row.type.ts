/**
 * One product's aggregated sales within a brand (drill-down breakdown).
 * `marginPct` and `sharePct` (of the brand's revenue) are filled by the service.
 */
export interface BrandProductRow {
  productId: string;
  productName: string;
  units: number;
  revenue: number;
  profit: number;
  marginPct: number;
  sharePct: number;
}
