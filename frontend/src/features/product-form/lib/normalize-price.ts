import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

/**
 * Convert a price the manager entered in `unitName` into the canonical
 * per-base-unit price. The base price is what `Product.sellingPrice` /
 * `Product.costPrice` stores on the BE — keeping all math in one
 * dimension simplifies POS line totals, inventory ledgers, and
 * cross-branch reporting.
 *
 * Math: `pricePerBaseUnit = enteredPrice / basisQty / unit.conversionToBase`.
 *
 * `basisQty` is the quantity of `unitName` the entered price covers, so the
 * manager can price weighed/volume goods however they think — "Rs 200 for
 * 0.5 kg" (basisQty 0.5 → Rs 400/kg), "Rs 1000 for 2 kg" (basisQty 2 →
 * Rs 500/kg). It defaults to 1, so existing callers normalize exactly as
 * before.
 *
 * Example: Rs 650 entered against a `12-PACK` row (conversion 12) yields
 * Rs 54.17 per base unit. Rs 100 entered against a `0.250 L` row
 * (conversion 0.25) yields Rs 400 per litre.
 *
 * Throws on:
 * - Unknown unit name (case-insensitive lookup against `units`).
 * - Non-positive or unparseable `conversionToBase`.
 * - Non-finite or non-positive `basisQty`.
 * - Non-finite or negative price (managers entering bad data).
 */
export function normalizePriceToBaseUnit(
    enteredPrice: number,
    unitName: string,
    units: readonly ISellableUnitRow[],
    basisQty = 1,
): number {
    if (!Number.isFinite(enteredPrice) || enteredPrice < 0) {
        throw new Error(`Invalid price: ${enteredPrice}`);
    }
    if (!Number.isFinite(basisQty) || basisQty <= 0) {
        throw new Error(`Invalid price quantity: ${basisQty}`);
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
    return enteredPrice / basisQty / conversion;
}
