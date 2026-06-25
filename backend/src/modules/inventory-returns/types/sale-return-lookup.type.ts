/** A returnable line of a looked-up sale (Phase C3). */
export interface ReturnableLine {
  saleItemId: string;
  productId: string;
  productName: string;
  barcode: string;
  unitLabel: string | null;
  quantitySold: number;
  alreadyReturned: number;
  remaining: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SaleReturnLookup {
  saleId: string;
  invoiceNumber: string;
  branchId: string;
  customerUserId: string | null;
  total: number;
  createdAt: Date;
  lines: ReturnableLine[];
}
