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

    it('converts to base units via conversionFactor (1000 g -> 1 kg)', () => {
        // Product stocked in kg at Rs 100/kg. Cashier picks `g`
        // (conversionFactor = 0.001) and types 1000 → bills as Rs 100.
        const r = computeLine({
            quantity: 1000,
            free: 0,
            unitPrice: 100,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 0.001,
        });
        expect(r.baseUnitQty).toBe(1);
        expect(r.lineSubtotal).toBe(100);
    });

    it('scales unitPrice by conversionFactor for non-base sub-units (250 g of Rs 200/kg = Rs 50)', () => {
        // The math fix: unitPrice is per-base-unit (Rs/kg). Selling 250g
        // from a kg-stocked product MUST bill at Rs 50, not Rs 50,000.
        const r = computeLine({
            quantity: 250,
            free: 0,
            unitPrice: 200,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 0.001,
        });
        expect(r.baseUnitQty).toBe(0.25);
        expect(r.lineSubtotal).toBe(50);
        expect(r.lineTotal).toBe(50);
    });

    it('scales unitPrice by conversionFactor for super-units (2 kg of Rs 0.5/g = Rs 1000)', () => {
        // Reverse case: product stocked in g at Rs 0.5/g. Cashier picks kg
        // (conversionFactor = 1000) → 2 kg bills at Rs 1000.
        const r = computeLine({
            quantity: 2,
            free: 0,
            unitPrice: 0.5,
            discountPercentage: 0,
            taxRate: 0,
            conversionFactor: 1000,
        });
        expect(r.baseUnitQty).toBe(2000);
        expect(r.lineSubtotal).toBe(1000);
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
