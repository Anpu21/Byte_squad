import { describe, it, expect } from 'vitest';
import { toCartItemSeed } from './cart-item-seed';
import type { ISearchProductRow } from '@/types';

const row: ISearchProductRow = {
    productId: 'p1',
    productCode: 'P-1',
    productName: 'Bread',
    productType: 'Grocery',
    baseUnit: 'unit',
    status: true,
    costPrice: 50,
    retailPrice: 80,
    taxRate: 5,
    discountAllowed: true,
    imageUrl: null,
    matchedUnit: null,
};

describe('toCartItemSeed', () => {
    it('pins the seed to the product retail price', () => {
        const seed = toCartItemSeed(row);
        expect(seed.unitPrice).toBe(80);
        expect(seed.productCode).toBe('P-1');
        expect(seed.unitName).toBe('unit');
        expect(seed.quantity).toBe(1);
    });

    it('forwards taxRate and discountAllowed verbatim so the line math stays Shanel-accurate', () => {
        const seed = toCartItemSeed(row);
        expect(seed.taxRate).toBe(5);
        expect(seed.discountAllowed).toBe(true);
        expect(seed.unitId).toBeNull();
        expect(seed.conversionFactor).toBe(1);
    });

    it('uses the matched sellable unit when a unit barcode was scanned', () => {
        const seed = toCartItemSeed({
            ...row,
            matchedUnit: {
                unitId: 'u-pack',
                unitName: '12-PACK',
                barcode: 'EGG-12',
                conversionToBase: 12,
                sellingPrice: 650,
            },
        });
        expect(seed.unitId).toBe('u-pack');
        expect(seed.unitName).toBe('12-PACK');
        expect(seed.unitPrice).toBe(650);
        expect(seed.conversionFactor).toBe(12);
    });
});
