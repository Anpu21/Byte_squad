import { describe, expect, it } from 'vitest';
import type { IDiscountScheme } from '@/types';
import { resolveSchemeDiscount } from './scheme-discount';

const PRODUCT_ID = 'prod-1';

function makeScheme(overrides: Partial<IDiscountScheme>): IDiscountScheme {
    return {
        id: 'scheme-1',
        name: 'Promo',
        branchId: null,
        scope: 'Product',
        productId: PRODUCT_ID,
        category: null,
        minQty: 0,
        discountPercentage: 10,
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        isActive: true,
        createdByUserId: 'user-1',
        createdAt: '2026-06-01T00:00:00Z',
        updatedAt: '2026-06-01T00:00:00Z',
        ...overrides,
    };
}

const input = { productId: PRODUCT_ID, category: 'Grocery', quantity: 1 };

describe('resolveSchemeDiscount', () => {
    it('returns 0 when nothing matches', () => {
        const schemes = [
            makeScheme({ productId: 'other' }),
            makeScheme({
                scope: 'Category',
                productId: null,
                category: 'Dairy',
            }),
        ];
        expect(resolveSchemeDiscount(schemes, input)).toBe(0);
    });

    it('a product rule beats a higher category rule', () => {
        const schemes = [
            makeScheme({ discountPercentage: 5 }),
            makeScheme({
                id: 'scheme-2',
                scope: 'Category',
                productId: null,
                category: 'Grocery',
                discountPercentage: 20,
            }),
        ];
        expect(resolveSchemeDiscount(schemes, input)).toBe(5);
    });

    it('falls back to the category rule when no product rule matches', () => {
        const schemes = [
            makeScheme({ productId: 'other' }),
            makeScheme({
                id: 'scheme-2',
                scope: 'Category',
                productId: null,
                category: 'grocery',
                discountPercentage: 7.5,
            }),
        ];
        expect(resolveSchemeDiscount(schemes, input)).toBe(7.5);
    });

    it('only bites once the quantity reaches the slab', () => {
        const schemes = [makeScheme({ minQty: 5, discountPercentage: 12 })];
        expect(resolveSchemeDiscount(schemes, { ...input, quantity: 4 })).toBe(
            0,
        );
        expect(resolveSchemeDiscount(schemes, { ...input, quantity: 5 })).toBe(
            12,
        );
    });

    it('takes the highest percentage within a tier', () => {
        const schemes = [
            makeScheme({ discountPercentage: 8 }),
            makeScheme({ id: 'scheme-2', discountPercentage: 15 }),
        ];
        expect(resolveSchemeDiscount(schemes, input)).toBe(15);
    });

    it('skips inactive rules', () => {
        const schemes = [makeScheme({ isActive: false })];
        expect(resolveSchemeDiscount(schemes, input)).toBe(0);
    });

    it('coerces decimal strings coming off the wire', () => {
        const schemes = [
            makeScheme({
                minQty: '5.000' as unknown as number,
                discountPercentage: '10.00' as unknown as number,
            }),
        ];
        expect(resolveSchemeDiscount(schemes, { ...input, quantity: 6 })).toBe(
            10,
        );
    });
});
