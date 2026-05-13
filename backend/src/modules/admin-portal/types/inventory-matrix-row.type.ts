import { InventoryMatrixCell } from '@admin-portal/types/inventory-matrix-cell.type';

export interface InventoryMatrixRow {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  sellingPrice: number;
  cells: InventoryMatrixCell[];
  totalQuantity: number;
}
