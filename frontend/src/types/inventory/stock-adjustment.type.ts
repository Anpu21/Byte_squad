// Phase C2 — reason-coded stock-adjustment workflow types.

export type IStockAdjustmentReason =
  | 'Damage'
  | 'Expired'
  | 'Theft'
  | 'Stock_Take'
  | 'Other'

export type IStockAdjustmentStatus = 'Pending' | 'Approved' | 'Reversed'

export interface IStockAdjustment {
  id: string
  productId: string
  branchId: string
  reason: IStockAdjustmentReason
  status: IStockAdjustmentStatus
  quantityBefore: number
  physicalQuantity: number
  difference: number
  notes: string | null
  createdByUserId: string
  reviewedByUserId: string | null
  reversedByUserId: string | null
  createdAt: string
  updatedAt: string
  product?: { id: string; name: string; barcode: string }
  branch?: { id: string; name: string }
}

export interface IPaginatedStockAdjustments {
  items: IStockAdjustment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ICreateStockAdjustmentPayload {
  productId: string
  branchId?: string
  reason: IStockAdjustmentReason
  physicalQuantity: number
  notes?: string
}

export interface IStockAdjustmentsParams {
  branchId?: string
  status?: IStockAdjustmentStatus
  page?: number
  limit?: number
}
