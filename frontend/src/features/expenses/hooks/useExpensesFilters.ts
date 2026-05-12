import { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedBranch } from '@/store/slices/adminContextSlice';
import { selectSelectedBranchId } from '@/store/selectors/adminContext';
import type { StatusFilter } from '../types/status-filter.type';

export interface ExpensesFiltersState {
    filterCategory: string;
    setFilterCategory: (value: string) => void;
    searchQuery: string;
    setSearchQuery: (value: string) => void;
    selectedStatus: StatusFilter;
    setSelectedStatus: (value: StatusFilter) => void;
    selectedBranchId: string;
    setSelectedBranchId: (value: string) => void;
    hasActiveFilter: boolean;
    resetFilters: () => void;
}

export function useExpensesFilters(isAdmin: boolean): ExpensesFiltersState {
    const dispatch = useAppDispatch();
    const pinnedBranchId = useAppSelector(selectSelectedBranchId);
    const selectedBranchId = pinnedBranchId ?? '';

    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');

    const setSelectedBranchId = useCallback(
        (value: string) => {
            dispatch(setSelectedBranch(value || null));
        },
        [dispatch],
    );

    const hasActiveFilter =
        filterCategory !== '' ||
        searchQuery !== '' ||
        selectedStatus !== 'all' ||
        (isAdmin && selectedBranchId !== '');

    const resetFilters = useCallback(() => {
        setFilterCategory('');
        setSearchQuery('');
        setSelectedStatus('all');
        dispatch(setSelectedBranch(null));
    }, [dispatch]);

    return {
        filterCategory,
        setFilterCategory,
        searchQuery,
        setSearchQuery,
        selectedStatus,
        setSelectedStatus,
        selectedBranchId,
        setSelectedBranchId,
        hasActiveFilter,
        resetFilters,
    };
}
