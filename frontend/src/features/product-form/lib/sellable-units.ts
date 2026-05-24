// Sibling BE source of truth: backend/src/modules/products/lib/default-sellable-units.ts
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

/**
 * Allow-list of base units accepted by the product form. Mirrors the
 * backend `SUPPORTED_BASE_UNITS` tuple — keep these in sync.
 */
export const SUPPORTED_BASE_UNITS_FE = [
    'kg',
    'g',
    'l',
    'ml',
    'each',
    'bottle',
    'pack',
    'box',
] as const;

export type TBaseUnitFe = (typeof SUPPORTED_BASE_UNITS_FE)[number];

type Seed = Omit<ISellableUnitRow, 'rowId'>;

const DEFAULTS: Record<TBaseUnitFe, Seed[]> = {
    kg: [
        { name: 'kg', isBase: true, conversionToBase: '1', displayOrder: 0 },
        { name: 'g', isBase: false, conversionToBase: '0.001', displayOrder: 1 },
    ],
    g: [
        { name: 'g', isBase: true, conversionToBase: '1', displayOrder: 0 },
        { name: 'kg', isBase: false, conversionToBase: '1000', displayOrder: 1 },
    ],
    l: [
        { name: 'l', isBase: true, conversionToBase: '1', displayOrder: 0 },
        { name: 'ml', isBase: false, conversionToBase: '0.001', displayOrder: 1 },
    ],
    ml: [
        { name: 'ml', isBase: true, conversionToBase: '1', displayOrder: 0 },
        { name: 'l', isBase: false, conversionToBase: '1000', displayOrder: 1 },
    ],
    each: [{ name: 'each', isBase: true, conversionToBase: '1', displayOrder: 0 }],
    bottle: [
        { name: 'bottle', isBase: true, conversionToBase: '1', displayOrder: 0 },
    ],
    pack: [{ name: 'pack', isBase: true, conversionToBase: '1', displayOrder: 0 }],
    box: [{ name: 'box', isBase: true, conversionToBase: '1', displayOrder: 0 }],
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
