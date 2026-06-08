/**
 * Shanel-aligned row returned by `GET /pos/products/search`. Mirrors what the
 * cashier typeahead needs to render a result and stage a cart line: identity
 * (id/code/name), classification (type/baseUnit), the single (retail) price
 * the cashier rings against, taxability, discount eligibility, and the
 * optional image URL. The wholesale tier was removed alongside the POS
 * Retail/Wholesale toggle — the column stays on the products table but is
 * no longer surfaced to the cashier.
 */
export interface SearchProductRow {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  baseUnit: string;
  status: boolean;
  costPrice: number;
  retailPrice: number;
  mrp: number | null;
  taxRate: number;
  discountAllowed: boolean;
  imageUrl: string | null;
  matchedUnit: {
    unitId: string;
    unitName: string;
    barcode: string | null;
    conversionToBase: number;
    sellingPrice: number;
  } | null;
}
