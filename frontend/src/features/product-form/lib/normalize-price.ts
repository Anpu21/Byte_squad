import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

/**
 * Convert a price the manager entered in `unitName` into the canonical
 * per-base-unit price. The base price is what `Product.sellingPrice` /
 * `Product.costPrice` stores on the BE — keeping all math in one
 * dimension simplifies POS line totals, inventory ledgers, and
 * cross-branch reporting.
 *
 * Math: `pricePerBaseUnit = enteredPrice / unit.conversionToBase`.
 *
 * Example: Rs 50 entered against the `100g` row (conversion 0.1) yields
 * Rs 500 per kg. Rs 100 entered against `250ml` (conversion 0.25) yields
 * Rs 400 per litre.
 *
 * Throws on:
 * - Unknown unit name (case-insensitive lookup against `units`).
 * - Non-positive or unparseable `conversionToBase`.
 * - Non-finite or negative price (managers entering bad data).
 */
export function normalizePriceToBaseUnit(
    enteredPrice: number,
    unitName: string,
    units: readonly ISellableUnitRow[],
): number {
    if (!Number.isFinite(enteredPrice) || enteredPrice < 0) {
        throw new Error(`Invalid price: ${enteredPrice}`);
    }
    const key = unitName.trim().toLowerCase();
    const matched = units.find((u) => u.name.trim().toLowerCase() === key);
    if (!matched) {
        throw new Error(`Unknown sellable unit: ${unitName}`);
    }
    const conversion = Number(matched.conversionToBase);
    if (!Number.isFinite(conversion) || conversion <= 0) {
        throw new Error(
            `Invalid conversion for unit ${matched.name}: ${matched.conversionToBase}`,
        );
    }
    return enteredPrice / conversion;
}
