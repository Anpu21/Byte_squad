/**
 * Shanel-aligned row returned by `GET /pos/products/search`. Mirrors what
 * the cashier typeahead needs to render a result and stage a cart line:
 * identity (id/code/name), classification (type/baseUnit), pricing for
 * both retail and wholesale, taxability, discount eligibility, and the
 * optional image URL.
 */
export interface ISearchProductRow {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  baseUnit: string;
  status: boolean;
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  taxRate: number;
  discountAllowed: boolean;
  imageUrl: string | null;
}
