import type { IProduct } from '@/types';

export interface CartItem {
    product: IProduct;
    quantity: number;
    unitPrice: number;
    // Pre-discount line value: quantity × unitPrice. Kept so the cart
    // table can render "Total" alongside "Discount" without re-deriving.
    lineTotal: number;
    // Optional per-line discount expressed as a percentage (0–100).
    // Edited inline via PosDiscountEditor.
    lineDiscountAmount?: number;
    // Post-line-discount value used for the visible "After Discount" column.
    effectiveLineTotal: number;
}
