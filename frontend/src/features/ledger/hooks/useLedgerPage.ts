import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLedgerFilters } from './useLedgerFilters';
import {
    useLedgerQuery,
    useLedgerSummaryQuery,
    LEDGER_PAGE_LIMIT,
} from './useLedgerQuery';
import { useLedgerExport } from './useLedgerExport';
import { computeRunningBalance } from '../lib/compute-balance';

export function useLedgerPage() {
    const { user } = useAuth();
    const filters = useLedgerFilters();
    const entriesQuery = useLedgerQuery(filters);
    const summaryQuery = useLedgerSummaryQuery();

    const entries = useMemo(
        () => entriesQuery.data?.items ?? [],
        [entriesQuery.data],
    );
    const total = entriesQuery.data?.total ?? 0;
    const totalPages = entriesQuery.data?.totalPages ?? 1;

    const entriesWithBalance = useMemo(
        () => computeRunningBalance(entries),
        [entries],
    );

    const exportApi = useLedgerExport({
        entryType: filters.entryType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        debouncedSearch: filters.debouncedSearch,
        summary: summaryQuery.data,
        user: user
            ? { firstName: user.firstName, lastName: user.lastName }
            : null,
    });

    const fetchError = entriesQuery.error
        ? 'Failed to load ledger entries'
        : null;
    const errorMessage = exportApi.exportError ?? fetchError;

    return {
        filters,
        entries,
        entriesWithBalance,
        total,
        totalPages,
        limit: LEDGER_PAGE_LIMIT,
        summary: summaryQuery.data ?? null,
        isLoading: entriesQuery.isLoading,
        errorMessage,
        isExporting: exportApi.isExporting,
        handleExport: exportApi.handleExport,
    };
}
