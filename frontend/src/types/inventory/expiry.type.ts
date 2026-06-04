// Phase C1 — product/batch expiry tracking types. Mirrors the backend
// inventory expiry contracts (ExpiryReport, ProductBatch).

export type IExpirySeverity = 'expired' | 'critical' | 'warning' | 'ok'

export interface IExpiryReportRow {
  batchId: string
  productId: string
  productName: string
  barcode: string
  branchId: string
  branchName: string
  batchNo: string | null
  expiryDate: string
  quantity: number
  daysToExpiry: number
  severity: IExpirySeverity
}

export interface IExpiryReport {
  rows: IExpiryReportRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IExpiryReportParams {
  branchId?: string
  withinDays?: number
  page?: number
  limit?: number
}

export interface IProductBatch {
  id: string
  productId: string
  branchId: string
  batchNo: string | null
  expiryDate: string | null
  quantity: number
  receivedAt: string
  notes: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
}

export interface ICreateProductBatchPayload {
  productId: string
  branchId?: string
  batchNo?: string
  expiryDate: string
  quantity: number
  notes?: string
}

export interface IExpiryScanSummary {
  branchesAffected: number
  notificationsSent: number
}
