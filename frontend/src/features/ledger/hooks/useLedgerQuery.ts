import { useQuery } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

export const LEDGER_PAGE_LIMIT = DEFAULT_PAGE_SIZE;

interface UseLedgerQueryArgs {
    entryType: string;
    startDate: string;
    endDate: string;
    debouncedSearch: string;
    page: number;
}

export function useLedgerQuery({
    entryType,
    startDate,
    endDate,
    debouncedSearch,
    page,
}: UseLedgerQueryArgs) {
    const filters = {
        entryType: entryType !== 'all' ? entryType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: LEDGER_PAGE_LIMIT,
    };
    return useQuery({
        queryKey: queryKeys.ledger.entries(filters),
        queryFn: () => accountingService.getLedgerEntries(filters),
    });
}

export function useLedgerSummaryQuery() {
    return useQuery({
        queryKey: queryKeys.ledger.summary(),
        queryFn: accountingService.getLedgerSummary,
    });
}
