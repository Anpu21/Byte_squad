import { toIsoDate } from './format';

export type PeriodKey = 'week' | 'month' | 'quarter' | 'ytd' | 'custom';

export const PERIOD_OPTIONS: { label: string; value: PeriodKey }[] = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'YTD', value: 'ytd' },
];

export interface DateRange {
    start: string;
    end: string;
}

export function rangeForPeriod(period: PeriodKey): DateRange {
    const now = new Date();
    const today = toIsoDate(now);
    if (period === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        return { start: toIsoDate(start), end: today };
    }
    if (period === 'month') {
        return {
            start: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
            end: today,
        };
    }
    if (period === 'quarter') {
        const q = Math.floor(now.getMonth() / 3);
        return {
            start: toIsoDate(new Date(now.getFullYear(), q * 3, 1)),
            end: today,
        };
    }
    if (period === 'ytd') {
        return {
            start: toIsoDate(new Date(now.getFullYear(), 0, 1)),
            end: today,
        };
    }
    return { start: today, end: today };
}
