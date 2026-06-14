import type { IBranch } from '../branch/branch.type';
import type { IProduct } from '../product/product.type';
import type { ISupplier } from './supplier.type';

export type GrnStatus = 'Received' | 'Voided';

export type GrnPaymentStatus = 'Unpaid' | 'Partially_Paid' | 'Paid';

/** Received line on a GRN (base-unit qty at a unit cost). */
export interface IGrnItem {
    id: string;
    grnId: string;
    productId: string;
    product?: IProduct;
    quantity: number;
    unitCost: number;
    lineTotal: number;
    batchNo: string | null;
    expiryDate: string | null;
}

/**
 * Goods Received Note — the purchase voucher AND the supplier bill.
 * `paidAmount`/`paymentStatus` advance as payments allocate against it.
 */
export interface IGrn {
    id: string;
    grnNumber: string;
    supplierId: string;
    supplier?: ISupplier;
    branchId: string;
    branch?: IBranch;
    purchaseOrderId: string | null;
    supplierInvoiceNo: string | null;
    /** ISO date `YYYY-MM-DD`. */
    grnDate: string;
    /** ISO date `YYYY-MM-DD` — grnDate + supplier credit terms. */
    dueDate: string;
    subTotal: number;
    discountAmount: number;
    grandTotal: number;
    paidAmount: number;
    paymentStatus: GrnPaymentStatus;
    status: GrnStatus;
    voidedAt: string | null;
    voidedByUserId: string | null;
    voidReason: string | null;
    notes: string | null;
    items?: IGrnItem[];
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}
