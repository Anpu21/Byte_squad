import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useInventoryByBranchQuery } from './useInventoryByBranchQuery';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';

const SEARCH_DEBOUNCE_MS = 300;
export const INVENTORY_PAGE_LIMIT = 10;

export function useInventory() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [stockStatus, setStockStatus] = useState('');
    const [page, setPage] = useState(1);

    const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search → query param.
    useEffect(() => {
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(debounceTimer.current);
    }, [search]);

    // Reset page when filters change (state-during-render pattern, avoids
    // the cascading-renders foot-gun of setState-in-useEffect).
    const filterSignature = `${debouncedSearch}|${category}|${stockStatus}`;
    const [lastFilterSignature, setLastFilterSignature] = useState(filterSignature);
    if (filterSignature !== lastFilterSignature) {
        setLastFilterSignature(filterSignature);
        setPage(1);
    }

    const params = {
        search: debouncedSearch || undefined,
        category: category || undefined,
        stockStatus: stockStatus || undefined,
        page,
        limit: INVENTORY_PAGE_LIMIT,
    };

    const inventoryQuery = useInventoryByBranchQuery(user?.branchId, params);

    const categoriesQuery = useQuery({
        queryKey: queryKeys.inventory.categories(),
        queryFn: inventoryService.getCategories,
        staleTime: 10 * 60_000,
    });

    const refetch = () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all() });
    };

    return {
        items: inventoryQuery.data?.items ?? [],
        categories: categoriesQuery.data ?? [],
        total: inventoryQuery.data?.total ?? 0,
        totalPages: inventoryQuery.data?.totalPages ?? 0,
        isLoading: inventoryQuery.isLoading,
        error: inventoryQuery.error
            ? 'Failed to load inventory'
            : categoriesQuery.error
                ? 'Failed to load categories'
                : null,
        search,
        setSearch,
        category,
        setCategory,
        stockStatus,
        setStockStatus,
        page,
        setPage,
        refetch,
    };
}
