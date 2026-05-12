import { useEffect, useMemo, useState } from 'react';
import { useInventoryByBranchQuery } from '@/hooks/useInventoryByBranchQuery';
import type { IProduct } from '@/types';

const SEARCH_DEBOUNCE_MS = 250;
const SEARCH_LIMIT = 12;

interface UsePosSearchResult {
    search: string;
    setSearch: (value: string) => void;
    clearSearch: () => void;
    searchResults: IProduct[];
    isSearching: boolean;
}

export function usePosSearch(
    branchId: string | null | undefined,
): UsePosSearchResult {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const trimmed = search.trim();

    // Synchronous clear: when the user empties the input, drop the debounced
    // value immediately so the query disables without waiting for the timer.
    if (!trimmed && debounced !== '') {
        setDebounced('');
    }

    useEffect(() => {
        if (!trimmed) return;
        const timer = setTimeout(
            () => setDebounced(trimmed),
            SEARCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [trimmed]);

    const query = useInventoryByBranchQuery(
        branchId,
        { search: debounced || undefined, limit: SEARCH_LIMIT },
        { enabled: Boolean(branchId) && debounced.length > 0 },
    );

    const searchResults = useMemo<IProduct[]>(() => {
        if (!debounced) return [];
        return (query.data?.items ?? []).map((inv) => inv.product);
    }, [query.data, debounced]);

    return {
        search,
        setSearch,
        clearSearch: () => setSearch(''),
        searchResults,
        isSearching: query.isFetching && debounced.length > 0,
    };
}
