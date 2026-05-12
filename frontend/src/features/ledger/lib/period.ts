import type { LedgerTimePeriod } from '../types/filters.type';

export interface DateRange {
    startDate: string;
    endDate: string;
}

function isoDate(d: Date): string {
    return d.toISOString().split('T')[0];
}

export function dateRangeForPeriod(period: LedgerTimePeriod): DateRange {
    const now = new Date();
    if (period === 'this_month') {
        return {
            startDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
            endDate: isoDate(now),
        };
    }
    if (period === 'last_month') {
        return {
            startDate: isoDate(
                new Date(now.getFullYear(), now.getMonth() - 1, 1),
            ),
            endDate: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
        };
    }
    if (period === 'this_year') {
        return {
            startDate: isoDate(new Date(now.getFullYear(), 0, 1)),
            endDate: isoDate(now),
        };
    }
    return { startDate: '', endDate: '' };
}

export function formatPeriodLabel(startDate: string, endDate: string): string {
    if (!startDate && !endDate) return 'All time';
    const fmt = (s: string) =>
        new Date(s).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
    if (startDate) return `From ${fmt(startDate)}`;
    return `Up to ${fmt(endDate)}`;
}
