import { InventoryMatrixBranchColumn } from '@admin-portal/types/inventory-matrix-branch-column.type';
import { InventoryMatrixRow } from '@admin-portal/types/inventory-matrix-row.type';

export interface InventoryMatrixResponse {
  branches: InventoryMatrixBranchColumn[];
  rows: InventoryMatrixRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
