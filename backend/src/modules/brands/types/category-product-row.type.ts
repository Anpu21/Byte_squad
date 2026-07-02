/**
 * One product in a category's brand-tagged product roster. `brandId`/`brandName`
 * are null for unbranded products. `sharePct` is share of the category total.
 */
export interface CategoryProductRow {
  productId: string;
  productName: string;
  brandId: string | null;
  brandName: string | null;
  color: string | null;
  units: number;
  revenue: number;
  profit: number;
  marginPct: number;
  sharePct: number;
}
