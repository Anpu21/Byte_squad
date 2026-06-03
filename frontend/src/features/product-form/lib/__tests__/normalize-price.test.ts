import { describe, expect, it } from 'vitest';
import { normalizePriceToBaseUnit } from '../normalize-price';
import type { ISellableUnitRow } from '../../types/sellable-unit-row.type';

const unitUnits: ISellableUnitRow[] = [
    { rowId: 'r1', name: 'unit', barcode: '', isBase: true, conversionToBase: '1', sellingPrice: '', displayOrder: 0 },
    { rowId: 'r2', name: '12-PACK', barcode: '', isBase: false, conversionToBase: '12', sellingPrice: '650', displayOrder: 1 },
];

const lUnits: ISellableUnitRow[] = [
    { rowId: 'r1', name: 'l', barcode: '', isBase: true, conversionToBase: '1', sellingPrice: '', displayOrder: 0 },
    { rowId: 'r2', name: '0.250 L', barcode: '', isBase: false, conversionToBase: '0.25', sellingPrice: '100', displayOrder: 1 },
];

describe('normalizePriceToBaseUnit', () => {
    it('returns the entered price unchanged when the unit is the base', () => {
        expect(normalizePriceToBaseUnit(60, 'unit', unitUnits)).toBe(60);
    });

    it('scales down when the entered price is for a pack unit', () => {
        expect(normalizePriceToBaseUnit(650, '12-PACK', unitUnits)).toBeCloseTo(54.1667);
    });

    it('handles fractional litre unit rows without using ml as a unit', () => {
        expect(normalizePriceToBaseUnit(100, '0.250 L', lUnits)).toBe(400);
    });

    it('is case-insensitive on unit name match', () => {
        expect(normalizePriceToBaseUnit(60, 'UNIT', unitUnits)).toBe(60);
    });

    it('throws when the unit name is not in the rows', () => {
        expect(() =>
            normalizePriceToBaseUnit(500, 'bag', unitUnits),
        ).toThrow(/unit/i);
    });

    it('throws when the matched row has non-positive conversionToBase', () => {
        const bad: ISellableUnitRow[] = [
            { rowId: 'r1', name: 'kg', barcode: '', isBase: true, conversionToBase: '0', sellingPrice: '', displayOrder: 0 },
        ];
        expect(() => normalizePriceToBaseUnit(100, 'kg', bad)).toThrow(/conversion/i);
    });

    it('throws when the matched row has unparseable conversionToBase', () => {
        const bad: ISellableUnitRow[] = [
            { rowId: 'r1', name: 'kg', barcode: '', isBase: true, conversionToBase: 'abc', sellingPrice: '', displayOrder: 0 },
        ];
        expect(() => normalizePriceToBaseUnit(100, 'kg', bad)).toThrow(/conversion/i);
    });

    it('throws on negative price', () => {
        expect(() => normalizePriceToBaseUnit(-1, 'unit', unitUnits)).toThrow(/price/i);
    });

    it('throws on non-finite price (NaN/Infinity)', () => {
        expect(() => normalizePriceToBaseUnit(NaN, 'unit', unitUnits)).toThrow(/price/i);
        expect(() => normalizePriceToBaseUnit(Infinity, 'unit', unitUnits)).toThrow(/price/i);
    });
});
