/**
 * One sellable unit of a product as returned by
 * `GET /pos/products/:productId/units`. The cashier UI shows these in a
 * dropdown next to the quantity input; `conversionToBase` converts the
 * typed quantity into the canonical base-unit amount used for inventory.
 */
export interface ProductUnitRow {
  unitId: string;
  unitName: string;
  barcode: string | null;
  isBaseUnit: boolean;
  conversionToBase: number;
  sellingPrice: number;
  displayOrder: number;
}
