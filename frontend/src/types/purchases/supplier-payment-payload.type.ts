import type { SupplierPaymentMethod } from './supplier-payment.type';

/** One allocation slice; omit `grnId` to settle the opening balance. */
export interface ISupplierPaymentAllocationPayload {
    grnId?: string;
    amount: number;
}

/** Request body for `POST /purchases/payments`. */
export interface ISupplierPaymentPayload {
    supplierId: string;
    /** Required for admins; managers are pinned to their own branch. */
    branchId?: string;
    method: SupplierPaymentMethod;
    amount: number;
    /** ISO date `YYYY-MM-DD`; defaults to today. */
    paidAt?: string;
    notes?: string;
    /** Must sum exactly to `amount`. */
    allocations: ISupplierPaymentAllocationPayload[];
}
