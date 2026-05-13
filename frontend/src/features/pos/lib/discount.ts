// Per-line percentage discount in money. The line base is quantity × unitPrice;
// the amount is a percentage (0–100) applied against the base. Result is
// clamped to [0, base] so a stale >100% input never produces negative line
// totals.
export function computeLineDiscountValue(
    quantity: number,
    unitPrice: number,
    amount: number | undefined,
): number {
    if (!amount || amount <= 0) return 0;
    const base = quantity * unitPrice;
    const raw = Math.round(base * (amount / 100) * 100) / 100;
    return Math.max(0, Math.min(base, raw));
}

export function computeEffectiveLineTotal(
    quantity: number,
    unitPrice: number,
    lineDiscountAmount: number | undefined,
): number {
    const base = Math.round(quantity * unitPrice * 100) / 100;
    const discount = computeLineDiscountValue(
        quantity,
        unitPrice,
        lineDiscountAmount,
    );
    return Math.max(0, Math.round((base - discount) * 100) / 100);
}
