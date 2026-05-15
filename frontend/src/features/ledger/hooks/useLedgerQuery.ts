import { useQuery } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';

export const LEDGER_PAGE_LIMIT = 20;

interface UseLedgerQueryArgs {
    branchId: string;
    entryType: string;
    startDate: string;
    endDate: string;
    debouncedSearch: string;
    page: number;
}

export function useLedgerQuery({
    branchId,
    entryType,
    startDate,
    endDate,
    debouncedSearch,
    page,
}: UseLedgerQueryArgs) {
    const filters = {
        branchId: branchId || undefined,
        entryType: entryType !== 'all' ? entryType : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        search: debouncedSearch || undefined,
        page,
        limit: LEDGER_PAGE_LIMIT,
    };
    return useQuery({
        queryKey: queryKeys.ledger.entries({
            branchId: branchId || null,
            entryType: entryType !== 'all' ? entryType : undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            search: debouncedSearch || undefined,
            page,
            limit: LEDGER_PAGE_LIMIT,
        }),
        queryFn: () => accountingService.getLedgerEntries(filters),
    });
}

export function useLedgerSummaryQuery(branchId?: string) {
    return useQuery({
        queryKey: queryKeys.ledger.summary(branchId || null),
        queryFn: () => accountingService.getLedgerSummary(branchId),
    });
}
