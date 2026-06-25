/**
 * The four tiles of the "Inventory Summary" widget. `totalProducts` is the
 * count of inventory rows in scope; `inventoryValue` is the on-hand valuation
 * (Σ quantity × product.costPrice).
 */
export interface InventorySummary {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
}
