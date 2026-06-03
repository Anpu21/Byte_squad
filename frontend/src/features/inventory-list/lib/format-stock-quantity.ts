export function formatStockQuantity(
    quantity: number | string,
    baseUnit: string | null | undefined,
): string {
    const num = Number(quantity);
    const unit = (baseUnit ?? 'unit').toUpperCase();
    if (unit === 'UNIT') {
        return `${Math.round(num)} UNIT`;
    }
    return `${num.toFixed(3)} ${unit}`;
}
