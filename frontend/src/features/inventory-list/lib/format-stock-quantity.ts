export function formatStockQuantity(
    quantity: number,
    baseUnit: string | null | undefined,
): string {
    const unit = (baseUnit ?? 'unit').toUpperCase();
    if (unit === 'UNIT') {
        return `${Math.round(quantity)} UNIT`;
    }
    return `${quantity.toFixed(3)} ${unit}`;
}
