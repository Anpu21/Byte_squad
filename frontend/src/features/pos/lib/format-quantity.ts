/**
 * Render a sale-line quantity for receipts and history rows. Trims trailing
 * zeros so 1.000 prints as "1" and 0.250 prints as "0.25", and clips to the
 * 3-decimal precision of `decimal(12,3)` columns the backend persists
 * (`base_unit_qty`, `free`, etc.). Non-finite inputs are surfaced verbatim
 * (`"NaN"`, `"Infinity"`) so a malformed payload never silently displays
 * `"0"` and hides the bug.
 */
export function formatQuantity(n: number): string {
    if (!Number.isFinite(n)) return String(n);
    return Number(n.toFixed(3)).toString();
}
