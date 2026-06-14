/** Line item for `POST /purchases/grns`. */
export interface IGrnItemPayload {
    productId: string;
    quantity: number;
    unitCost: number;
    batchNo?: string;
    /** ISO date `YYYY-MM-DD`. */
    expiryDate?: string;
}

/** Request body for `POST /purchases/grns` (goods receipt). */
export interface IGrnPayload {
    supplierId: string;
    /** Required for admins; managers are pinned to their own branch. */
    branchId?: string;
    /** Converting a purchase order — marked Received in the same txn. */
    purchaseOrderId?: string;
    supplierInvoiceNo?: string;
    /** ISO date `YYYY-MM-DD`; defaults to today on the BE. */
    grnDate?: string;
    discountAmount?: number;
    notes?: string;
    items: IGrnItemPayload[];
}
