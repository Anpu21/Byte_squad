/**
 * A sellable unit exposed to the storefront so the customer can pick how they
 * buy a product (e.g. base `unit` vs a `12-PACK`). `conversionToBase` converts
 * the chosen unit's quantity into the product base unit for inventory/orders.
 */
export interface ShopSellableUnit {
  id: string;
  name: string;
  isBase: boolean;
  conversionToBase: number;
  sellingPrice: number;
  displayOrder: number;
}
