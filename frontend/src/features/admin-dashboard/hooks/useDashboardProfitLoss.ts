import { useQuery } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Month-to-date P&L feeding the dashboard's profit KPIs, expense-breakdown
 * donut and profitability panel. The date range is fixed for v1 (the header
 * date-range control is cosmetic); reuses the shared `accounting.profitLoss`
 * cache key so it dedupes with the Financial Reports page. ADMIN-only on the
 * backend — managers get an error which the widgets render as an EmptyState.
 */
function monthToDateRange(): { start: string; end: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const toISO = (d: Date) => d.toISOString().split('T')[0];
    return { start: toISO(start), end: toISO(now) };
}

export function useDashboardProfitLoss() {
    const { start, end } = monthToDateRange();
    return useQuery({
        queryKey: queryKeys.accounting.profitLoss(start, end),
        queryFn: () => accountingService.getProfitLoss(start, end),
        staleTime: 30_000,
    });
}
