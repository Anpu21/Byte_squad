/**
 * Math helpers for the invoiceTotal section. The cashier-level cart
 * discount is a percentage applied on top of the already-discounted line
 * subtotals, mirroring Shanel's "Discount (%) on grand total" behaviour
 * where the percentage acts on the pre-tax `itemsSubtotal` and the cart
 * total then folds in tax.
 *
 * Pure functions — no React, no state. Component-level state lives in
 * `PosPage`; this file just owns the arithmetic so it can be unit-tested
 * without rendering anything.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface IInvoiceTotalSummary {
    itemsSubtotal: number;
    totalLineDiscount: number;
    cartDiscountAmount: number;
    totalTax: number;
    cartTotal: number;
}

/**
 * Apply a cart-level percentage discount on top of line-level totals.
 * Returns both the absolute cart-discount amount AND the resulting
 * cart total. The cart total is clamped at 0 so a discount that
 * exceeds the subtotal can't push the bill negative.
 *
 * Tax is intentionally NOT discounted — Shanel keeps the per-item tax
 * the cashier sees on each row and only the pre-tax subtotal absorbs
 * the cart-level percentage.
 */
export function applyCartDiscount(
    itemsSubtotal: number,
    totalLineDiscount: number,
    totalTax: number,
    cartDiscountPercentage: number,
): { cartDiscountAmount: number; cartTotal: number } {
    void totalLineDiscount; // accepted for signature parity; not used in math today
    const cartDiscountAmount = round2(
        itemsSubtotal * (cartDiscountPercentage / 100),
    );
    const cartTotal = round2(
        Math.max(0, itemsSubtotal - cartDiscountAmount + totalTax),
    );
    return { cartDiscountAmount, cartTotal };
}
