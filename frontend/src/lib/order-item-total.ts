/**
 * Charged total for a persisted order line: a "buy by amount" line is its firm
 * `fixedPriceOverride`; every other line is unit price × quantity. Mirrors the
 * backend's line total and the cart's `shopLineTotal`, and coerces the decimal
 * strings the API returns for numeric columns.
 */
export function orderItemLineTotal(item: {
    unitPriceSnapshot: number | string;
    quantity: number | string;
    fixedPriceOverride?: number | string | null;
}): number {
    if (item.fixedPriceOverride != null) {
        return Number(item.fixedPriceOverride);
    }
    return Number(item.unitPriceSnapshot) * Number(item.quantity);
}
