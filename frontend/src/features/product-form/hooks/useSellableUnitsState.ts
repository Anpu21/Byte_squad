import { useState } from 'react';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';
import {
    type TBaseUnitFe,
    defaultUnitRowsFor,
} from '../lib/sellable-units';

/**
 * Owns the baseUnit + editable sellable-units rows for the product form.
 * Split out of `useProductFormState` to keep each hook focused on a single
 * concern. All update helpers are immutable.
 */
export interface SellableUnitsState {
    baseUnit: TBaseUnitFe;
    setBaseUnit: (next: TBaseUnitFe) => void;
    units: ISellableUnitRow[];
    /**
     * Replace the entire rows array. Used by `useProductLoader` to hydrate
     * the editor from an existing product's persisted unit list.
     */
    setUnits: (next: ISellableUnitRow[]) => void;
    resetUnitsForBase: (next: TBaseUnitFe) => void;
    addUnit: () => void;
    updateUnit: (
        rowId: string,
        patch: Partial<Omit<ISellableUnitRow, 'rowId'>>,
    ) => void;
    removeUnit: (rowId: string) => void;
    setBaseRow: (rowId: string) => void;
}

export function useSellableUnitsState(): SellableUnitsState {
    const [baseUnit, setBaseUnit] = useState<TBaseUnitFe>('unit');
    const [units, setUnits] = useState<ISellableUnitRow[]>(() =>
        defaultUnitRowsFor('unit'),
    );

    function resetUnitsForBase(next: TBaseUnitFe) {
        setBaseUnit(next);
        setUnits(defaultUnitRowsFor(next));
    }

    function addUnit() {
        setUnits((current) => [
            ...current,
            {
                rowId: crypto.randomUUID(),
                name: '',
                barcode: '',
                isBase: false,
                conversionToBase: '1',
                sellingPrice: '',
                displayOrder: current.length,
            },
        ]);
    }

    function updateUnit(
        rowId: string,
        patch: Partial<Omit<ISellableUnitRow, 'rowId'>>,
    ) {
        setUnits((current) =>
            current.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row)),
        );
    }

    function removeUnit(rowId: string) {
        setUnits((current) => current.filter((row) => row.rowId !== rowId));
    }

    function setBaseRow(rowId: string) {
        setUnits((current) =>
            current.map((row) => ({
                ...row,
                isBase: row.rowId === rowId,
                conversionToBase:
                    row.rowId === rowId ? '1' : row.conversionToBase,
            })),
        );
    }

    return {
        baseUnit,
        setBaseUnit,
        units,
        setUnits,
        resetUnitsForBase,
        addUnit,
        updateUnit,
        removeUnit,
        setBaseRow,
    };
}
