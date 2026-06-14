import type { IProduct } from '../product/product.type';

/** One returned line on a debit note (cost snapshots the GRN line). */
export interface IPurchaseReturnItem {
    id: string;
    purchaseReturnId: string;
    productId: string;
    product?: IProduct;
    quantity: number;
    unitCost: number;
    lineTotal: number;
}

/** Debit note raised against a GRN. */
export interface IPurchaseReturn {
    id: string;
    returnNumber: string;
    grnId: string;
    supplierId: string;
    branchId: string;
    total: number;
    reason: string;
    items?: IPurchaseReturnItem[];
    createdByUserId: string;
    createdAt: string;
}
