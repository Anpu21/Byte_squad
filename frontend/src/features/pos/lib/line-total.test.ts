import { describe, it, expect } from 'vitest';
import { computeLine } from './line-total';

describe('computeLine', () => {
    it('subtotal excludes free units (qty 10, free 2, price 100)', () => {
        const r = computeLine({
            quantity: 10,
            free: 2,
            unitPrice: 100,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 1,
        });
        expect(r.chargedQty).toBe(8);
        expect(r.lineSubtotal).toBe(800);
        expect(r.lineTotal).toBe(800);
    });

    it('applies discount before tax (qty 1, price 100, disc 10%, tax 15%)', () => {
        const r = computeLine({
            quantity: 1,
            free: 0,
            unitPrice: 100,
            discountPercentage: 10,
            taxRate: 15,
            conversionFactor: 1,
        });
        expect(r.lineSubtotal).toBe(90);
        expect(r.lineDiscountAmount).toBe(10);
        expect(r.lineTaxAmount).toBe(13.5);
        expect(r.lineTotal).toBe(103.5);
    });

    it('supports weighted base-unit decimals (0.250 KG at Rs 400/KG)', () => {
        const r = computeLine({
            quantity: 0.25,
            free: 0,
            unitPrice: 400,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 1,
        });
        expect(r.baseUnitQty).toBe(0.25);
        expect(r.lineSubtotal).toBe(100);
    });

    it('uses selected pack price while deducting converted UNIT stock', () => {
        const r = computeLine({
            quantity: 1,
            free: 0,
            unitPrice: 650,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 12,
        });
        expect(r.baseUnitQty).toBe(12);
        expect(r.lineSubtotal).toBe(650);
        expect(r.lineTotal).toBe(650);
    });

    it('clamps chargedQty to zero when free >= quantity', () => {
        const r = computeLine({
            quantity: 2,
            free: 5,
            unitPrice: 100,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 1,
        });
        expect(r.chargedQty).toBe(0);
        expect(r.lineSubtotal).toBe(0);
        expect(r.lineTotal).toBe(0);
    });
});
