import { useCallback, useState } from 'react';
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
    const [filterCategory, setFilterCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');

    const hasActiveFilter =
        filterCategory !== '' ||
        searchQuery !== '' ||
        selectedStatus !== 'all' ||
        (isAdmin && selectedBranchId !== '');

    const resetFilters = useCallback(() => {
        setFilterCategory('');
        setSearchQuery('');
        setSelectedStatus('all');
        setSelectedBranchId('');
    }, []);

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
