import { describe, it, expect } from 'vitest';
import { applyCartDiscount } from './pos-invoice-total.helpers';

describe('applyCartDiscount', () => {
    it('returns subtotal + tax as the cart total when the cart discount is 0%', () => {
        const { cartDiscountAmount, cartTotal } = applyCartDiscount(
            1000,
            0,
            150,
            0,
        );
        expect(cartDiscountAmount).toBe(0);
        expect(cartTotal).toBe(1150);
    });

    it('computes the discount amount and folds tax back in (10% on 1000 + 150 tax)', () => {
        const { cartDiscountAmount, cartTotal } = applyCartDiscount(
            1000,
            0,
            150,
            10,
        );
        expect(cartDiscountAmount).toBe(100);
        expect(cartTotal).toBe(1050); // 1000 - 100 + 150
    });

    it('clamps the cart total to 0 when the cart discount exceeds the subtotal', () => {
        // 150% discount on a 100 subtotal would otherwise yield a -50 total.
        const { cartDiscountAmount, cartTotal } = applyCartDiscount(
            100,
            0,
            0,
            150,
        );
        expect(cartDiscountAmount).toBe(150);
        expect(cartTotal).toBe(0);
    });

    it('rounds the cart-discount amount and total to two decimals', () => {
        // 33.333% of 99.99 -> 33.32 (rounded from 33.32667)
        const { cartDiscountAmount, cartTotal } = applyCartDiscount(
            99.99,
            0,
            0,
            33.333,
        );
        expect(cartDiscountAmount).toBe(33.33);
        expect(cartTotal).toBe(66.66);
    });
});
