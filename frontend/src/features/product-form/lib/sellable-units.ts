// Sibling BE source of truth: backend/src/modules/products/lib/default-sellable-units.ts
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

/**
 * Allow-list of base units accepted by the product form. Mirrors the
 * backend `SUPPORTED_BASE_UNITS` tuple — keep these in sync.
 */
export const SUPPORTED_BASE_UNITS_FE = [
    'kg',
    'l',
    'unit',
] as const;

export type TBaseUnitFe = (typeof SUPPORTED_BASE_UNITS_FE)[number];

type Seed = Omit<ISellableUnitRow, 'rowId'>;

const DEFAULTS: Record<TBaseUnitFe, Seed[]> = {
    kg: [
        {
            name: 'kg',
            barcode: '',
            isBase: true,
            conversionToBase: '1',
            sellingPrice: '',
            displayOrder: 0,
        },
    ],
    l: [
        {
            name: 'l',
            barcode: '',
            isBase: true,
            conversionToBase: '1',
            sellingPrice: '',
            displayOrder: 0,
        },
    ],
    unit: [
        {
            name: 'unit',
            barcode: '',
            isBase: true,
            conversionToBase: '1',
            sellingPrice: '',
            displayOrder: 0,
        },
    ],
};

function newRowId(): string {
    // Vitest jsdom 29 and modern browsers both ship crypto.randomUUID.
    return crypto.randomUUID();
}

/**
 * FE mirror of `defaultSellableUnitsFor` on the backend. When the manager
 * picks a baseUnit, the editor seeds these rows immediately so they can
 * edit before saving. The BE helper is the source of truth — keep this
 * table in sync; both files cross-link in their JSDoc.
 */
export function defaultUnitRowsFor(baseUnit: TBaseUnitFe): ISellableUnitRow[] {
    return DEFAULTS[baseUnit].map((seed) => ({ ...seed, rowId: newRowId() }));
}

export function isSupportedBaseUnitFe(value: string): value is TBaseUnitFe {
    return (SUPPORTED_BASE_UNITS_FE as readonly string[]).includes(value);
}
