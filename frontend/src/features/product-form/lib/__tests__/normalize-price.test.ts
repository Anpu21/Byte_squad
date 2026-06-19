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

const kgUnits: ISellableUnitRow[] = [
    { rowId: 'r1', name: 'kg', barcode: '', isBase: true, conversionToBase: '1', sellingPrice: '', displayOrder: 0 },
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

    it('divides the entered price by the basis quantity (200 for 0.5 kg → 400/kg)', () => {
        expect(normalizePriceToBaseUnit(200, 'kg', kgUnits, 0.5)).toBe(400);
    });

    it('handles a basis greater than 1 (1000 for 2 kg → 500/kg)', () => {
        expect(normalizePriceToBaseUnit(1000, 'kg', kgUnits, 2)).toBe(500);
    });

    it('defaults the basis to 1 so existing 3-arg calls are unchanged', () => {
        expect(normalizePriceToBaseUnit(400, 'kg', kgUnits)).toBe(400);
        expect(normalizePriceToBaseUnit(400, 'kg', kgUnits, 1)).toBe(400);
    });

    it('combines the basis quantity with the unit conversion factor', () => {
        // 1300 for two 12-PACKs → 1300 / 2 / 12 per base unit.
        expect(normalizePriceToBaseUnit(1300, '12-PACK', unitUnits, 2)).toBeCloseTo(54.1667);
    });

    it('throws on a non-positive or non-finite basis quantity', () => {
        expect(() => normalizePriceToBaseUnit(100, 'kg', kgUnits, 0)).toThrow(/quantity/i);
        expect(() => normalizePriceToBaseUnit(100, 'kg', kgUnits, -1)).toThrow(/quantity/i);
        expect(() => normalizePriceToBaseUnit(100, 'kg', kgUnits, NaN)).toThrow(/quantity/i);
    });
});
