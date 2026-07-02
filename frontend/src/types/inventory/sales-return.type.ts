// Phase C3 — sales returns (invoice lookup, good/bad split, restock) types.

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
}

export interface ICreateSalesReturnPayload {
  saleId: string
  reason?: string
  lines: ICreateSalesReturnLine[]
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
