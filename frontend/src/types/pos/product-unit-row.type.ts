/**
 * One sellable unit of a product as returned by
 * `GET /pos/products/:productId/units`. The cashier UI shows these in a
 * dropdown next to the quantity input; `conversionToBase` converts the
 * typed quantity into the canonical base-unit amount used for inventory.
 */
export interface IProductUnitRow {
  unitId: string;
  unitName: string;
  isBaseUnit: boolean;
  conversionToBase: number;
  displayOrder: number;
}
