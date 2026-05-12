import type { DiscountType } from '../types/pad-mode.type';

export function computeDiscountValue(
    subtotal: number,
    amount: number,
    type: DiscountType,
): number {
    if (type === 'percentage') {
        return Math.round(subtotal * (amount / 100) * 100) / 100;
    }
    return amount;
}

export function computeTotal(subtotal: number, discountValue: number): number {
    return Math.max(0, Math.round((subtotal - discountValue) * 100) / 100);
}
