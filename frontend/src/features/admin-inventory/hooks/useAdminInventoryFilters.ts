import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedBranch } from '@/store/slices/adminContextSlice';
import { selectSelectedBranchId } from '@/store/selectors/adminContext';
import type { StockKey } from '../types/stock-key.type';
import type { AdminInventoryMatrixFilters } from '@/lib/queryKeys';
import { PAGE_LIMIT } from '../constants';

const SEARCH_DEBOUNCE_MS = 300;

export interface AdminInventoryFiltersState {
    search: string;
    branchId: string;
    stockStatus: '' | StockKey;
    category: string;
    page: number;
    searchInput: string;
    setSearchInput: (value: string) => void;
    clearSearch: () => void;
    setBranchId: (value: string) => void;
    setStockStatus: (value: '' | StockKey) => void;
    setCategory: (value: string) => void;
    setPage: (value: number) => void;
    resetFilters: () => void;
    serverParams: AdminInventoryMatrixFilters;
    hasActiveFilter: boolean;
}

function parseStockStatus(raw: string | null): '' | StockKey {
    if (raw === 'in_stock' || raw === 'low_stock' || raw === 'out_of_stock') {
        return raw;
    }
    return '';
}

export function useAdminInventoryFilters(): AdminInventoryFiltersState {
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const pinnedBranchId = useAppSelector(selectSelectedBranchId);

    const search = searchParams.get('q') ?? '';
    // URL ?branch= wins; otherwise fall back to admin's pinned branch in Redux.
    const branchId = searchParams.get('branch') ?? pinnedBranchId ?? '';
    const stockStatus = parseStockStatus(searchParams.get('stock'));
    const category = searchParams.get('category') ?? '';
    const page = Number(searchParams.get('page') ?? '1') || 1;

    const [searchInput, setSearchInput] = useState(search);

    const updateParams = useCallback(
        (updates: Record<string, string | number | null>) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    for (const [k, v] of Object.entries(updates)) {
                        if (
                            v === null ||
                            v === '' ||
                            (k === 'page' && v === 1)
                        ) {
                            next.delete(k);
                        } else {
                            next.set(k, String(v));
                        }
                    }
                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    useEffect(() => {
        if (searchInput === search) return;
        const timer = setTimeout(() => {
            updateParams({ q: searchInput || null, page: 1 });
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchInput, search, updateParams]);

    const clearSearch = useCallback(() => {
        setSearchInput('');
        updateParams({ q: null, page: 1 });
    }, [updateParams]);

    const setBranchId = useCallback(
        (value: string) => {
            updateParams({ branch: value || null, page: 1 });
            dispatch(setSelectedBranch(value || null));
        },
        [updateParams, dispatch],
    );

    const setStockStatus = useCallback(
        (value: '' | StockKey) => updateParams({ stock: value || null, page: 1 }),
        [updateParams],
    );

    const setCategory = useCallback(
        (value: string) => updateParams({ category: value || null, page: 1 }),
        [updateParams],
    );

    const setPage = useCallback(
        (value: number) => updateParams({ page: value }),
        [updateParams],
    );

    const resetFilters = useCallback(() => {
        setSearchInput('');
        setSearchParams(new URLSearchParams(), { replace: true });
        dispatch(setSelectedBranch(null));
    }, [setSearchParams, dispatch]);

    const lowStockOnly =
        stockStatus === 'low_stock' || stockStatus === 'out_of_stock';

    const serverParams = useMemo<AdminInventoryMatrixFilters>(
        () => ({
            search: search || undefined,
            category: category || undefined,
            lowStockOnly: lowStockOnly || undefined,
            page,
            limit: PAGE_LIMIT,
        }),
        [search, category, lowStockOnly, page],
    );

    const hasActiveFilter =
        search !== '' ||
        branchId !== '' ||
        stockStatus !== '' ||
        category !== '';

    return {
        search,
        branchId,
        stockStatus,
        category,
        page,
        searchInput,
        setSearchInput,
        clearSearch,
        setBranchId,
        setStockStatus,
        setCategory,
        setPage,
        resetFilters,
        serverParams,
        hasActiveFilter,
    };
}
