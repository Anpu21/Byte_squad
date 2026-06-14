import type { IBranch } from '../branch/branch.type';
import type { IProduct } from '../product/product.type';
import type { ISupplier } from './supplier.type';

export type PurchaseOrderStatus = 'Draft' | 'Sent' | 'Received' | 'Cancelled';

/** One ordered line on a PO. */
export interface IPurchaseOrderItem {
    id: string;
    purchaseOrderId: string;
    productId: string;
    product?: IProduct;
    quantity: number;
    unitCost: number;
}

/**
 * Purchase order — intent only (no stock/ledger effect). Receiving it
 * converts into a GRN and flips the status to Received.
 */
export interface IPurchaseOrder {
    id: string;
    poNumber: string;
    supplierId: string;
    supplier?: ISupplier;
    branchId: string;
    branch?: IBranch;
    status: PurchaseOrderStatus;
    /** ISO date `YYYY-MM-DD`. */
    expectedDate: string | null;
    totalValue: number;
    notes: string | null;
    items?: IPurchaseOrderItem[];
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
}
