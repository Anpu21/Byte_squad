/** Line item for `POST /purchases/returns`. */
export interface IPurchaseReturnItemPayload {
    productId: string;
    quantity: number;
}

/** Request body for `POST /purchases/returns` (debit note). */
export interface IPurchaseReturnPayload {
    grnId: string;
    reason: string;
    items: IPurchaseReturnItemPayload[];
}
