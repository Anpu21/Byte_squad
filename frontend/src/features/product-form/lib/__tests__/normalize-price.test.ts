import { describe, expect, it } from 'vitest';
import { normalizePriceToBaseUnit } from '../normalize-price';
import type { ISellableUnitRow } from '../../types/sellable-unit-row.type';

const kgUnits: ISellableUnitRow[] = [
    { rowId: 'r1', name: 'kg', isBase: true, conversionToBase: '1', displayOrder: 0 },
    { rowId: 'r2', name: 'g', isBase: false, conversionToBase: '0.001', displayOrder: 1 },
    { rowId: 'r3', name: '100g', isBase: false, conversionToBase: '0.1', displayOrder: 2 },
];

const lUnits: ISellableUnitRow[] = [
    { rowId: 'r1', name: 'l', isBase: true, conversionToBase: '1', displayOrder: 0 },
    { rowId: 'r2', name: 'ml', isBase: false, conversionToBase: '0.001', displayOrder: 1 },
    { rowId: 'r3', name: '250ml', isBase: false, conversionToBase: '0.25', displayOrder: 2 },
];

describe('normalizePriceToBaseUnit', () => {
    it('returns the entered price unchanged when the unit is the base', () => {
        expect(normalizePriceToBaseUnit(500, 'kg', kgUnits)).toBe(500);
    });

    it('scales up when the unit is smaller than the base (g → kg)', () => {
        // Rs 0.5 per g = Rs 500 per kg
        expect(normalizePriceToBaseUnit(0.5, 'g', kgUnits)).toBe(500);
    });

    it('handles custom non-base units (100g → kg)', () => {
        // Rs 50 per 100g = Rs 500 per kg
        expect(normalizePriceToBaseUnit(50, '100g', kgUnits)).toBe(500);
    });

    it('handles volume units (250ml → l)', () => {
        // Rs 100 per 250ml = Rs 400 per litre
        expect(normalizePriceToBaseUnit(100, '250ml', lUnits)).toBe(400);
    });

    it('is case-insensitive on unit name match', () => {
        expect(normalizePriceToBaseUnit(500, 'KG', kgUnits)).toBe(500);
    });

    it('throws when the unit name is not in the rows', () => {
        expect(() =>
            normalizePriceToBaseUnit(500, 'bag', kgUnits),
        ).toThrow(/unit/i);
    });

    it('throws when the matched row has non-positive conversionToBase', () => {
        const bad: ISellableUnitRow[] = [
            { rowId: 'r1', name: 'kg', isBase: true, conversionToBase: '0', displayOrder: 0 },
        ];
        expect(() => normalizePriceToBaseUnit(100, 'kg', bad)).toThrow(/conversion/i);
    });

    it('throws when the matched row has unparseable conversionToBase', () => {
        const bad: ISellableUnitRow[] = [
            { rowId: 'r1', name: 'kg', isBase: true, conversionToBase: 'abc', displayOrder: 0 },
        ];
        expect(() => normalizePriceToBaseUnit(100, 'kg', bad)).toThrow(/conversion/i);
    });

    it('throws on negative price', () => {
        expect(() => normalizePriceToBaseUnit(-1, 'kg', kgUnits)).toThrow(/price/i);
    });

    it('throws on non-finite price (NaN/Infinity)', () => {
        expect(() => normalizePriceToBaseUnit(NaN, 'kg', kgUnits)).toThrow(/price/i);
        expect(() => normalizePriceToBaseUnit(Infinity, 'kg', kgUnits)).toThrow(/price/i);
    });
});
