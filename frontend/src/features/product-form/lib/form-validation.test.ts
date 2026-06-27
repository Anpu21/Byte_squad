import { describe, expect, it } from 'vitest';
import { validateProductForm, type ProductFormValues } from './form-validation';

function values(overrides: Partial<ProductFormValues> = {}): ProductFormValues {
    return {
        name: 'Banana',
        barcode: 'BAN-001',
        pluCode: '',
        category: 'Produce',
        costPrice: '200',
        sellingPrice: '400',
        baseUnit: 'kg',
        initialStock: '1.001',
        lowStockThreshold: '1',
        ...overrides,
    };
}

describe('validateProductForm stock quantity rules', () => {
    it('allows KG and L stock quantities up to 3 decimal places', () => {
        expect(validateProductForm(values({ baseUnit: 'kg' }), false).initialStock).toBeUndefined();
        expect(validateProductForm(values({ baseUnit: 'l' }), false).initialStock).toBeUndefined();
    });

    it('rejects more than 3 decimal places for weighted stock', () => {
        expect(
            validateProductForm(values({ initialStock: '1.0005' }), false).initialStock,
        ).toBe('Stock supports up to 3 decimal places');
    });

    it('rejects fractional UNIT stock quantities', () => {
        expect(
            validateProductForm(
                values({ baseUnit: 'unit', initialStock: '1.001' }),
                false,
            ).initialStock,
        ).toBe('UNIT stock must be a whole number');
    });
});

describe('validateProductForm PLU rules', () => {
    it('accepts an empty PLU and a digits-only PLU', () => {
        expect(validateProductForm(values({ pluCode: '' }), false).pluCode).toBeUndefined();
        expect(validateProductForm(values({ pluCode: '00042' }), false).pluCode).toBeUndefined();
    });

    it('rejects a non-numeric PLU', () => {
        expect(validateProductForm(values({ pluCode: 'AB12' }), false).pluCode).toBe(
            'PLU must be 1–16 digits',
        );
    });
});
