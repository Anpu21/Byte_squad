import { describe, it, expect } from 'vitest';
import {
    isFractionalUnit,
    qtyRules,
    clampQty,
    formatQty,
    quantityForAmount,
    amountForQuantity,
} from './unit-quantity';

describe('isFractionalUnit', () => {
    it('treats weighable / pourable units as fractional', () => {
        expect(isFractionalUnit('kg')).toBe(true);
        expect(isFractionalUnit('L')).toBe(true);
        expect(isFractionalUnit(' Kg ')).toBe(true);
    });

    it('treats the countable unit (any case) as whole-number', () => {
        expect(isFractionalUnit('unit')).toBe(false);
        expect(isFractionalUnit('UNIT')).toBe(false);
    });

    it('defaults an empty unit to whole-number (safe default)', () => {
        expect(isFractionalUnit('')).toBe(false);
        expect(isFractionalUnit('   ')).toBe(false);
    });
});

describe('qtyRules', () => {
    it('lets fractional units step by 0.25 with a 0.05 minimum and 3 decimals', () => {
        expect(qtyRules('kg')).toEqual({ step: 0.25, min: 0.05, decimals: 3 });
    });

    it('keeps countable units whole', () => {
        expect(qtyRules('unit')).toEqual({ step: 1, min: 1, decimals: 0 });
    });
});

describe('clampQty', () => {
    it('keeps a valid fractional amount', () => {
        expect(clampQty(1.5, 'kg')).toBe(1.5);
        expect(clampQty(0.25, 'kg')).toBe(0.25);
        expect(clampQty(0.05, 'kg')).toBe(0.05);
        expect(clampQty(0.1, 'kg')).toBe(0.1);
    });

    it('floors fractional amounts to the 0.05 minimum', () => {
        expect(clampQty(0, 'kg')).toBe(0.05);
        expect(clampQty(-5, 'kg')).toBe(0.05);
        expect(clampQty(0.02, 'kg')).toBe(0.05);
    });

    it('rounds fractional amounts to 3 decimals', () => {
        expect(clampQty(1.2349, 'kg')).toBe(1.235);
    });

    it('rounds countable amounts to whole numbers and floors to 1', () => {
        expect(clampQty(2.4, 'unit')).toBe(2);
        expect(clampQty(0, 'unit')).toBe(1);
    });

    it('returns the minimum for non-finite input', () => {
        expect(clampQty(Number.NaN, 'kg')).toBe(0.05);
        expect(clampQty(Number.NaN, 'unit')).toBe(1);
    });
});

describe('formatQty', () => {
    it('trims trailing zeros and appends the unit', () => {
        expect(formatQty(1.5, 'kg')).toBe('1.5 kg');
        expect(formatQty(2, 'kg')).toBe('2 kg');
        expect(formatQty(0.25, 'kg')).toBe('0.25 kg');
        expect(formatQty(3, 'unit')).toBe('3 unit');
    });
});

describe('quantityForAmount', () => {
    it('derives the nearest weight a cash amount buys (1000 ÷ 170 → 5.882 kg)', () => {
        expect(quantityForAmount(1000, 170, 'kg')).toBe(5.882);
    });

    it('does not floor to the order minimum — the add gate handles that', () => {
        // 1 Rs of a 170/kg product is ~0.006 kg, below the 0.05 min; the derived
        // weight must stay true so it reconciles with the entered amount.
        expect(quantityForAmount(1, 170, 'kg')).toBe(0.006);
    });

    it('returns 0 for a non-positive price or non-finite input', () => {
        expect(quantityForAmount(1000, 0, 'kg')).toBe(0);
        expect(quantityForAmount(Number.NaN, 170, 'kg')).toBe(0);
    });
});

describe('amountForQuantity', () => {
    it('costs a weight at the unit price, rounded to 2 dp (5.882 × 170 → 999.94)', () => {
        expect(amountForQuantity(5.882, 170)).toBe(999.94);
    });

    it('is the rounding-tolerant inverse of quantityForAmount', () => {
        const qty = quantityForAmount(1000, 170, 'kg'); // 5.882
        // Recomputes to 999.94 — inside the backend's
        // max(0.01, price × 0.001) = 0.17 reconciliation gap of 1000.
        expect(Math.abs(1000 - amountForQuantity(qty, 170))).toBeLessThanOrEqual(
            0.17,
        );
    });

    it('returns 0 for non-finite input', () => {
        expect(amountForQuantity(Number.NaN, 170)).toBe(0);
    });
});
