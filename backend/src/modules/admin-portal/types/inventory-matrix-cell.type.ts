export interface InventoryMatrixCell {
  branchId: string;
  inventoryId: string | null;
  quantity: number;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  lastRestockedAt: Date | null;
}
