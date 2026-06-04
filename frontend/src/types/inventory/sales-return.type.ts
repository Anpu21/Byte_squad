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
  page?: number
  limit?: number
}
