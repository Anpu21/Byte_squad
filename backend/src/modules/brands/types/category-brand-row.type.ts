/**
 * One brand's sales within a single category — the "same category, different
 * brands" comparison row. `brandId` is null for the Unbranded bucket (products
 * in this category with no brand). `sharePct` is share of the category total.
 */
export interface CategoryBrandRow {
  brandId: string | null;
  brandName: string;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  transactions: number;
  marginPct: number;
  sharePct: number;
}
