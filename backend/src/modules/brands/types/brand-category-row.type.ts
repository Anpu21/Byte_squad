/**
 * One category's sales within a single brand's drill-down. "A brand has many
 * categories" is derived through the brand's products (there is no direct
 * brand↔category link). `sharePct` is the category's share of the brand total.
 */
export interface BrandCategoryRow {
  categoryId: string;
  categoryName: string;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
  marginPct: number;
  sharePct: number;
}
