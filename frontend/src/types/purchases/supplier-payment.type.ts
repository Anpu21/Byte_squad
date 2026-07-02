import type { IBranch } from '../branch/branch.type';
import type { IGrn } from './grn.type';
import type { ISupplier } from './supplier.type';

export type SupplierPaymentMethod = 'Cash' | 'Card';

/** One slice of a payment applied to a bill (null grn = opening balance). */
export interface ISupplierPaymentAllocation {
    id: string;
    paymentId: string;
    grnId: string | null;
    grn?: IGrn | null;
    amount: number;
}

/** Supplier payment voucher with bill-by-bill allocations. */
export interface ISupplierPayment {
    id: string;
    paymentNumber: string;
    supplierId: string;
    supplier?: ISupplier;
    branchId: string;
    branch?: IBranch;
    method: SupplierPaymentMethod;
    amount: number;
    /** ISO date `YYYY-MM-DD`. */
    paidAt: string;
    notes: string | null;
    allocations?: ISupplierPaymentAllocation[];
    createdByUserId: string;
    createdAt: string;
}
