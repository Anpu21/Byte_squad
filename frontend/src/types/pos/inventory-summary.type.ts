/**
 * The four "Inventory Summary" tiles. Mirrors `InventorySummary` on the
 * backend; `inventoryValue` is on-hand valuation (Σ qty × costPrice).
 */
export interface IInventorySummary {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    inventoryValue: number;
}
