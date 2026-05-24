import { describe, it, expect } from 'vitest';
import { toCartItemSeed } from './cart-item-seed';
import type { ISearchProductRow } from '@/types';

const row: ISearchProductRow = {
    productId: 'p1',
    productCode: 'P-1',
    productName: 'Bread',
    productType: 'Grocery',
    baseUnit: 'pcs',
    status: true,
    costPrice: 50,
    retailPrice: 80,
    taxRate: 5,
    discountAllowed: true,
    imageUrl: null,
};

describe('toCartItemSeed', () => {
    it('pins the seed to the product retail price', () => {
        const seed = toCartItemSeed(row);
        expect(seed.unitPrice).toBe(80);
        expect(seed.productCode).toBe('P-1');
        expect(seed.unitName).toBe('pcs');
        expect(seed.quantity).toBe(1);
    });

    it('forwards taxRate and discountAllowed verbatim so the line math stays Shanel-accurate', () => {
        const seed = toCartItemSeed(row);
        expect(seed.taxRate).toBe(5);
        expect(seed.discountAllowed).toBe(true);
        expect(seed.unitId).toBeNull();
        expect(seed.conversionFactor).toBe(1);
    });
});
