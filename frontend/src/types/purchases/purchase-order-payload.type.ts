/** Line item for `POST /purchases/orders`. */
export interface IPurchaseOrderItemPayload {
    productId: string;
    quantity: number;
    unitCost: number;
}

/** Request body for `POST /purchases/orders`. */
export interface IPurchaseOrderPayload {
    supplierId: string;
    /** Required for admins; managers are pinned to their own branch. */
    branchId?: string;
    /** ISO date `YYYY-MM-DD`. */
    expectedDate?: string;
    notes?: string;
    items: IPurchaseOrderItemPayload[];
}
