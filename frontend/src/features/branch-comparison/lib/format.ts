export type MetricKey =
    | 'revenue'
    | 'grossProfit'
    | 'transactions'
    | 'aov'
    | 'activeProducts'
    | 'loyaltyMembers';

export type ComparisonView =
    | 'summary'
    | 'sales'
    | 'products'
    | 'inventory'
    | 'loyalty'
    | 'customers'
    | 'payments'
    | 'staff';

export const COMPARISON_VIEWS: ComparisonView[] = [
    'summary',
    'sales',
    'products',
    'inventory',
    'loyalty',
    'customers',
    'payments',
    'staff',
];

export function formatCurrencyWhole(n: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(n);
}

export function formatNumber(n: number, maximumFractionDigits = 0): string {
    return new Intl.NumberFormat('en-LK', {
        maximumFractionDigits,
    }).format(n);
}

export function formatPercent(n: number): string {
    return `${(n * 100).toFixed(1)}%`;
}

export function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toLocaleString();
}

export function compactCurrency(value: number): string {
  return `Rs ${compactNumber(value)}`;
}

export function chartValue(value: number | string | undefined): string {
  if (typeof value === "number") return compactNumber(value);
  return value ? String(value) : "0";
}

export function toInputDate(d: Date): string {
    const pad = (x: number) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDayShort(dateIso: string): string {
    return new Date(dateIso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

export function formatDateRange(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const sameYear = s.getFullYear() === e.getFullYear();
    const opts: Intl.DateTimeFormatOptions = sameYear
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' };
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}
