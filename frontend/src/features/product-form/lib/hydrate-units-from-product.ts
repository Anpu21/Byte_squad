import type { IProduct } from '@/types';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';
import {
    type TBaseUnitFe,
    isSupportedBaseUnitFe,
} from './sellable-units';

interface UnitsTarget {
    setBaseUnit: (next: TBaseUnitFe) => void;
    setUnits: (next: ISellableUnitRow[]) => void;
    resetUnitsForBase: (next: TBaseUnitFe) => void;
}

/**
 * Drop a loaded product's `baseUnit` + persisted unit rows onto the
 * editor state. Falls back to the FE default rows whenever the API
 * response omits the relation (legacy products, or any other shape that
 * doesn't include `sellableUnits`), so the editor always has at least
 * one row to render. Persisted rows are sorted by `displayOrder` because
 * the UI assumes a stable render order and the API isn't contractually
 * obliged to sort.
 *
 * Pure with respect to its inputs aside from the supplied setters; kept
 * outside the hook so the hydration body stays small and unit-testable
 * without a TanStack QueryClient.
 */
export function hydrateUnitsFromProduct(
    product: IProduct,
    target: UnitsTarget,
): void {
    const baseUnit = isSupportedBaseUnitFe(product.baseUnit)
        ? product.baseUnit
        : 'each';

    if (product.sellableUnits && product.sellableUnits.length > 0) {
        const sorted = [...product.sellableUnits].sort(
            (a, b) => a.displayOrder - b.displayOrder,
        );
        const rows: ISellableUnitRow[] = sorted.map((unit) => ({
            rowId: crypto.randomUUID(),
            name: unit.name,
            isBase: unit.isBase,
            conversionToBase: String(unit.conversionToBase),
            displayOrder: unit.displayOrder,
        }));
        target.setBaseUnit(baseUnit);
        target.setUnits(rows);
        return;
    }

    target.resetUnitsForBase(baseUnit);
}
