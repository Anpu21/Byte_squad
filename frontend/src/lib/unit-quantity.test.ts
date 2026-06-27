import { describe, it, expect } from 'vitest';
import { isFractionalUnit, qtyRules, clampQty, formatQty } from './unit-quantity';

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
    it('lets fractional units step by 0.25 down to 1 g/ml with 3 decimals', () => {
        expect(qtyRules('kg')).toEqual({ step: 0.25, min: 0.001, decimals: 3 });
    });

    it('keeps countable units whole', () => {
        expect(qtyRules('unit')).toEqual({ step: 1, min: 1, decimals: 0 });
    });
});

describe('clampQty', () => {
    it('keeps a valid fractional amount', () => {
        expect(clampQty(1.5, 'kg')).toBe(1.5);
        expect(clampQty(0.25, 'kg')).toBe(0.25);
    });

    it('floors fractional amounts to the 1 g/ml minimum', () => {
        expect(clampQty(0, 'kg')).toBe(0.001);
        expect(clampQty(-5, 'kg')).toBe(0.001);
        expect(clampQty(0.0004, 'kg')).toBe(0.001);
    });

    it('rounds fractional amounts to 3 decimals', () => {
        expect(clampQty(1.2349, 'kg')).toBe(1.235);
    });

    it('rounds countable amounts to whole numbers and floors to 1', () => {
        expect(clampQty(2.4, 'unit')).toBe(2);
        expect(clampQty(0, 'unit')).toBe(1);
    });

    it('returns the minimum for non-finite input', () => {
        expect(clampQty(Number.NaN, 'kg')).toBe(0.001);
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
