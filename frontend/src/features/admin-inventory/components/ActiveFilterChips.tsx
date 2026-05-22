import { Search, X } from 'lucide-react';
import type { IInventoryMatrixBranchColumn } from '@/types';
import type { AdminInventoryFiltersState } from '../hooks/useAdminInventoryFilters';
import { STOCK_LABEL } from '../constants';

interface ActiveFilterChipsProps {
    filters: AdminInventoryFiltersState;
    branches: IInventoryMatrixBranchColumn[];
    recordCount: number;
}

interface ChipProps {
    children: React.ReactNode;
    onClear: () => void;
}

function Chip({ children, onClear }: ChipProps) {
    return (
        <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
        >
            {children}
            <X size={12} className="opacity-70" />
        </button>
    );
}

export function ActiveFilterChips({
    filters,
    branches,
    recordCount,
}: ActiveFilterChipsProps) {
    if (!filters.hasActiveFilter) return null;

    const branchName = filters.branchId
        ? (branches.find((b) => b.id === filters.branchId)?.name ?? '')
        : '';

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
            {filters.search && (
                <Chip onClear={filters.clearSearch}>
                    <Search size={11} />
                    <span>&ldquo;{filters.search}&rdquo;</span>
                </Chip>
            )}
            {filters.branchId && branchName && (
                <Chip onClear={() => filters.setBranchId('')}>
                    <span>{branchName}</span>
                </Chip>
            )}
            {filters.stockStatus && (
                <Chip onClear={() => filters.setStockStatus('')}>
                    <span>{STOCK_LABEL[filters.stockStatus]}</span>
                </Chip>
            )}
            {filters.category && (
                <Chip onClear={() => filters.setCategory('')}>
                    <span>{filters.category}</span>
                </Chip>
            )}
            <button
                type="button"
                onClick={filters.resetFilters}
                className="text-xs text-text-3 hover:text-text-1 underline-offset-4 hover:underline transition-colors"
            >
                Reset all
            </button>
            <span className="ml-auto text-xs text-text-3">
                {recordCount} {recordCount === 1 ? 'record' : 'records'}
            </span>
        </div>
    );
}
