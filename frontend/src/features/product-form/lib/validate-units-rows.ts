// Sibling BE source of truth: backend/src/modules/products/lib/validate-sellable-units.ts
import { isCompleteNumber } from '@/lib/numeric-input';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

/**
 * Packed shape produced once the editor rows pass validation. Ready to
 * drop straight onto the `inventoryService.createProduct` /
 * `updateProduct` payload.
 */
export interface IPackedSellableUnit {
    name: string;
    isBase: boolean;
    conversionToBase: number;
    displayOrder: number;
}

export interface ValidUnitsResult {
    ok: true;
    rows: IPackedSellableUnit[];
}

export interface InvalidUnitsResult {
    ok: false;
    error: string;
}

export type ValidateUnitsRowsResult = ValidUnitsResult | InvalidUnitsResult;

/**
 * Pure validator + packer for the editable sellable-unit rows.
 *
 * Rules mirror `validateSellableUnits` on the backend:
 * - At least one non-blank row (whitespace-only names are dropped).
 * - Every kept row has a non-empty name.
 * - Names are unique case-insensitively.
 * - Exactly one row is marked `isBase`.
 * - Every `conversionToBase` parses to a finite number > 0.
 * - The base row's `conversionToBase` must equal 1 (mirrors the BE rule).
 *
 * Returns `{ ok: true, rows }` with parsed numeric `conversionToBase` and
 * a contiguous `displayOrder` sequence; `{ ok: false, error }` otherwise.
 * Never throws — callers stash the message on the form-error slot.
 */
export function validateUnitsRows(
    rows: readonly ISellableUnitRow[],
): ValidateUnitsRowsResult {
    const kept = rows.filter((r) => r.name.trim() !== '');
    if (kept.length === 0) {
        return { ok: false, error: 'At least one sellable unit is required.' };
    }

    const seen = new Set<string>();
    for (const row of kept) {
        const key = row.name.trim().toLowerCase();
        if (seen.has(key)) {
            return {
                ok: false,
                error: `Duplicate unit name: ${row.name.trim()}`,
            };
        }
        seen.add(key);
    }

    const baseRows = kept.filter((r) => r.isBase);
    if (baseRows.length !== 1) {
        return {
            ok: false,
            error: 'Exactly one sellable unit must be marked as the base unit.',
        };
    }

    const packed: IPackedSellableUnit[] = [];
    for (let i = 0; i < kept.length; i += 1) {
        const row = kept[i];
        if (!isCompleteNumber(row.conversionToBase)) {
            return {
                ok: false,
                error: `Conversion for "${row.name.trim()}" must be a number.`,
            };
        }
        const parsed = Number(row.conversionToBase);
        if (!Number.isFinite(parsed) || parsed <= 0) {
            return {
                ok: false,
                error: `Conversion for "${row.name.trim()}" must be greater than 0.`,
            };
        }
        if (row.isBase && parsed !== 1) {
            return {
                ok: false,
                error: 'The base unit must have a conversion factor of 1.',
            };
        }
        packed.push({
            name: row.name.trim(),
            isBase: row.isBase,
            conversionToBase: parsed,
            displayOrder: i,
        });
    }

    return { ok: true, rows: packed };
}
