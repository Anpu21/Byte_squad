export function formatCurrencyWhole(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

export function toIsoDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

export function formatDateRangeLabel(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    const sopts: Intl.DateTimeFormatOptions = sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return `${s.toLocaleDateString('en-US', sopts)} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
