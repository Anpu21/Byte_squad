import { describe, it, expect } from 'vitest';
import { validateUnitsRows } from './validate-units-rows';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

function row(overrides: Partial<ISellableUnitRow>): ISellableUnitRow {
    return {
        rowId: overrides.rowId ?? `row-${Math.random()}`,
        name: 'each',
        isBase: false,
        conversionToBase: '1',
        displayOrder: 0,
        ...overrides,
    };
}

describe('validateUnitsRows', () => {
    it('packs valid rows with parsed numeric conversion and contiguous order', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '1' }),
            row({ name: 'g', isBase: false, conversionToBase: '0.001' }),
        ]);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.rows).toEqual([
            { name: 'kg', isBase: true, conversionToBase: 1, displayOrder: 0 },
            {
                name: 'g',
                isBase: false,
                conversionToBase: 0.001,
                displayOrder: 1,
            },
        ]);
    });

    it('drops whitespace-only rows before checking the rest', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '1' }),
            row({ name: '   ', isBase: false, conversionToBase: '99' }),
        ]);
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0].name).toBe('kg');
    });

    it('rejects when every row is blank', () => {
        const result = validateUnitsRows([
            row({ name: '', isBase: true, conversionToBase: '1' }),
            row({ name: '   ', isBase: false, conversionToBase: '1' }),
        ]);
        expect(result).toEqual({
            ok: false,
            error: 'At least one sellable unit is required.',
        });
    });

    it('rejects duplicate names case-insensitively', () => {
        const result = validateUnitsRows([
            row({ name: 'KG', isBase: true, conversionToBase: '1' }),
            row({ name: 'kg', isBase: false, conversionToBase: '0.5' }),
        ]);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toMatch(/duplicate unit name/i);
    });

    it('rejects when no row is marked as base', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: false, conversionToBase: '1' }),
            row({ name: 'g', isBase: false, conversionToBase: '0.001' }),
        ]);
        expect(result).toEqual({
            ok: false,
            error: 'Exactly one sellable unit must be marked as the base unit.',
        });
    });

    it('rejects when more than one row is marked as base', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '1' }),
            row({ name: 'g', isBase: true, conversionToBase: '1' }),
        ]);
        expect(result).toEqual({
            ok: false,
            error: 'Exactly one sellable unit must be marked as the base unit.',
        });
    });

    it('rejects non-numeric conversion values', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '1' }),
            row({ name: 'g', isBase: false, conversionToBase: '0.' }),
        ]);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toMatch(/must be a number/i);
    });

    it('rejects zero or negative conversion values', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '1' }),
            row({ name: 'g', isBase: false, conversionToBase: '0' }),
        ]);
        expect(result.ok).toBe(false);
        if (result.ok) return;
        expect(result.error).toMatch(/greater than 0/i);
    });

    it('rejects when the base row has a conversion factor other than 1', () => {
        const result = validateUnitsRows([
            row({ name: 'kg', isBase: true, conversionToBase: '2' }),
        ]);
        expect(result).toEqual({
            ok: false,
            error: 'The base unit must have a conversion factor of 1.',
        });
    });
});
