// Phase C3 — sales returns (invoice lookup, good/bad split, restock) types.
import type { ISale } from '@/types/pos/sale.type'

export interface IReturnableLine {
  saleItemId: string
  productId: string
  productName: string
  barcode: string
  unitLabel: string | null
  quantitySold: number
  alreadyReturned: number
  remaining: number
  unitPrice: number
  lineTotal: number
}

export interface ISaleReturnLookup {
  saleId: string
  invoiceNumber: string
  branchId: string
  customerUserId: string | null
  total: number
  createdAt: string
  lines: IReturnableLine[]
}

export interface ICreateSalesReturnLine {
  saleItemId: string
  goodQuantity: number
  badQuantity: number
  restockGood: boolean
  /** Optional expiry (YYYY-MM-DD) for restocked good units → recreates a batch. */
  expiryDate?: string
}

export interface ICreateSalesReturnPayload {
  saleId: string
  reason?: string
  lines: ICreateSalesReturnLine[]
}

// ── Exchange (return goods ↔ replacement goods, net-cash settlement) ──────────

/** One replacement basket line (same server-authoritative pricing as a sale). */
export interface IReplacementItemInput {
  productId: string
  quantity: number
  /** Server re-validates this against the product/unit price. */
  unitPrice: number
  unitId?: string | null
  taxRate?: number
  discountPercentage?: number
}

/** Upcharge payment for a dearer swap (customer pays P − R). Cash or Card only. */
export interface IExchangePaymentInput {
  paymentMethod: 'Cash' | 'Card'
  paymentAmount: number
  cashAmount?: number
  cashTendered?: number
}

export interface ICreateExchangePayload {
  saleId: string
  reason?: string
  returnedLines: ICreateSalesReturnLine[]
  replacementItems: IReplacementItemInput[]
  /** Required only when the replacement costs more than the returned goods. */
  payment?: IExchangePaymentInput
}

export interface IExchangeResult {
  salesReturn: ISalesReturn
  replacementSale: ISale
}

export interface ISalesReturnItem {
  id: string
  saleItemId: string
  productId: string
  goodQuantity: number
  badQuantity: number
  baseUnitQtyGood: number
  restockGood: boolean
  refundAmount: number
}

export interface ISalesReturn {
  id: string
  saleId: string
  invoiceNumber: string
  branchId: string
  customerUserId: string | null
  totalRefundAmount: number
  restockedValue: number
  reason: string | null
  status: string
  /** 'Refund' (default) | 'Exchange'. Exchanges are settled by a replacement sale. */
  type?: string
  /** The replacement Sale for an exchange (null for a plain refund). */
  replacementSaleId?: string | null
  createdByUserId: string
  createdAt: string
  items?: ISalesReturnItem[]
  branch?: { id: string; name: string }
  /** The cashier/manager/admin who processed the return (safe fields only). */
  createdBy?: { id: string; firstName: string; lastName: string }
}

export interface IPaginatedSalesReturns {
  items: ISalesReturn[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IReturnsParams {
  branchId?: string
  cashierId?: string
  startDate?: string
  endDate?: string
  search?: string
  status?: string
  page?: number
  limit?: number
}

// ── Returns analytics (dashboard) ──────────────────────────────────────────

export interface IReturnsAnalyticsParams {
  branchId?: string
  cashierId?: string
  startDate?: string
  endDate?: string
}

export interface IReturnsTotals {
  returnsCount: number
  totalRefunded: number
  restockedValue: number
  /** Damaged units logged against returns (sold-unit qty), audit-only stock. */
  damagedQty: number
}

export interface IReturnsByBranchRow {
  branchId: string
  branchName: string
  returnsCount: number
  totalRefunded: number
}

export interface IReturnsByCashierRow {
  cashierId: string
  cashierName: string
  returnsCount: number
  totalRefunded: number
}

export interface IReturnsTrendPoint {
  /** ISO date (YYYY-MM-DD). */
  date: string
  returnsCount: number
  totalRefunded: number
}

export interface IReturnsAnalytics {
  range: { startDate: string; endDate: string }
  totals: IReturnsTotals
  byBranch: IReturnsByBranchRow[]
  byCashier: IReturnsByCashierRow[]
  trend: IReturnsTrendPoint[]
}
