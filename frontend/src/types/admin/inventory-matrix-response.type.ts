import type { IInventoryMatrixBranchColumn } from '@/types/admin/inventory-matrix-branch-column.type'
import type { IInventoryMatrixRow } from '@/types/admin/inventory-matrix-row.type'

export interface IInventoryMatrixResponse {
  branches: IInventoryMatrixBranchColumn[]
  rows: IInventoryMatrixRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}
