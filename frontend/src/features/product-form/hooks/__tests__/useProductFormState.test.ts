import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductFormState } from '../useProductFormState';
import { defaultUnitRowsFor } from '../../lib/sellable-units';

describe('defaultUnitRowsFor', () => {
    it('returns a single kg base row for kg', () => {
        const rows = defaultUnitRowsFor('kg');
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            name: 'kg',
            barcode: '',
            isBase: true,
            conversionToBase: '1',
            sellingPrice: '',
            displayOrder: 0,
        });
    });

    it('returns a single row for unit', () => {
        const rows = defaultUnitRowsFor('unit');
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({
            name: 'unit',
            isBase: true,
            conversionToBase: '1',
            displayOrder: 0,
        });
    });
});

describe('useProductFormState — sellable-unit state', () => {
    it('initialises baseUnit="unit" with a single unit row', () => {
        const { result } = renderHook(() => useProductFormState());
        expect(result.current.baseUnit).toBe('unit');
        expect(result.current.units).toHaveLength(1);
        expect(result.current.units[0].name).toBe('unit');
        expect(result.current.units[0].isBase).toBe(true);
    });

    it('resetUnitsForBase swaps baseUnit and reseeds the unit rows', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.resetUnitsForBase('kg'));
        expect(result.current.baseUnit).toBe('kg');
        expect(result.current.units).toHaveLength(1);
        expect(result.current.units.map((r) => r.name)).toEqual(['kg']);
    });

    it('addUnit appends a fresh empty row with a unique rowId', () => {
        const { result } = renderHook(() => useProductFormState());
        const initialRowId = result.current.units[0].rowId;
        act(() => result.current.addUnit());
        expect(result.current.units).toHaveLength(2);
        const added = result.current.units[1];
        expect(added.name).toBe('');
        expect(added.barcode).toBe('');
        expect(added.isBase).toBe(false);
        expect(added.conversionToBase).toBe('1');
        expect(added.sellingPrice).toBe('');
        expect(added.displayOrder).toBe(1);
        expect(added.rowId).not.toBe(initialRowId);
    });

    it('updateUnit patches only the targeted row', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.addUnit());
        const targetRowId = result.current.units[1].rowId;
        const untouchedRowId = result.current.units[0].rowId;
        act(() =>
            result.current.updateUnit(targetRowId, {
                name: 'gram',
                conversionToBase: '0.002',
            }),
        );
        const target = result.current.units.find((r) => r.rowId === targetRowId);
        const untouched = result.current.units.find(
            (r) => r.rowId === untouchedRowId,
        );
        expect(target?.name).toBe('gram');
        expect(target?.conversionToBase).toBe('0.002');
        expect(untouched?.name).toBe('unit');
        expect(untouched?.conversionToBase).toBe('1');
    });

    it('removeUnit drops only the targeted row', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.addUnit());
        const removeRowId = result.current.units[1].rowId;
        const keepRowId = result.current.units[0].rowId;
        act(() => result.current.removeUnit(removeRowId));
        expect(result.current.units).toHaveLength(1);
        expect(result.current.units[0].rowId).toBe(keepRowId);
    });

    it('setBaseRow flips isBase on the target and forces its conversion to 1', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.addUnit());
        const targetRowId = result.current.units[1].rowId;
        // Pre-condition: target row is currently a non-base row.
        expect(
            result.current.units.find((r) => r.rowId === targetRowId)?.isBase,
        ).toBe(false);

        act(() => result.current.setBaseRow(targetRowId));
        const target = result.current.units.find((r) => r.rowId === targetRowId);
        const other = result.current.units.find((r) => r.rowId !== targetRowId);
        expect(target?.isBase).toBe(true);
        expect(target?.conversionToBase).toBe('1');
        expect(other?.isBase).toBe(false);
    });

    it('setUnits replaces the entire rows array wholesale', () => {
        const { result } = renderHook(() => useProductFormState());
        const replacement = [
            {
                rowId: 'r-a',
                name: 'sack',
                barcode: '',
                isBase: true,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: 0,
            },
            {
                rowId: 'r-b',
                name: 'kg',
                barcode: 'SACK-KG',
                isBase: false,
                conversionToBase: '0.04',
                sellingPrice: '100',
                displayOrder: 1,
            },
        ];
        act(() => result.current.setUnits(replacement));
        expect(result.current.units).toEqual(replacement);
    });
});

describe('useProductFormState — per-price unit state', () => {
    it('initialises costPriceUnit and sellingPriceUnit to the base unit', () => {
        const { result } = renderHook(() => useProductFormState());
        expect(result.current.costPriceUnit).toBe('unit');
        expect(result.current.sellingPriceUnit).toBe('unit');
    });

    it('resetUnitsForBase("l") also resets both price units to "l"', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.resetUnitsForBase('l'));
        expect(result.current.baseUnit).toBe('l');
        expect(result.current.costPriceUnit).toBe('l');
        expect(result.current.sellingPriceUnit).toBe('l');
    });

    it('setSellingPriceUnit changes only sellingPriceUnit, not costPriceUnit', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.resetUnitsForBase('kg'));
        act(() => result.current.setSellingPriceUnit('12-PACK'));
        expect(result.current.sellingPriceUnit).toBe('12-PACK');
        expect(result.current.costPriceUnit).toBe('kg');
    });

    it('initialises both price-basis quantities to "1"', () => {
        const { result } = renderHook(() => useProductFormState());
        expect(result.current.costPriceQty).toBe('1');
        expect(result.current.sellingPriceQty).toBe('1');
    });

    it('resetUnitsForBase resets both price-basis quantities back to "1"', () => {
        const { result } = renderHook(() => useProductFormState());
        act(() => result.current.setSellingPriceQty('0.5'));
        act(() => result.current.setCostPriceQty('2'));
        act(() => result.current.resetUnitsForBase('kg'));
        expect(result.current.sellingPriceQty).toBe('1');
        expect(result.current.costPriceQty).toBe('1');
    });
});
