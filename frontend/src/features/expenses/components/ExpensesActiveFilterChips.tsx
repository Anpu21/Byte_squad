import { Building2, Search, X } from 'lucide-react';
import type { ExpensesFiltersState } from '../hooks/useExpensesFilters';

interface ExpensesActiveFilterChipsProps {
    filters: ExpensesFiltersState;
    isAdmin: boolean;
    visibleCount: number;
    totalCount: number;
    branchLabel: (id: string) => string;
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

export function ExpensesActiveFilterChips({
    filters,
    isAdmin,
    visibleCount,
    totalCount,
    branchLabel,
}: ExpensesActiveFilterChipsProps) {
    if (!filters.hasActiveFilter) return null;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
            {filters.searchQuery && (
                <Chip onClear={() => filters.setSearchQuery('')}>
                    <Search size={11} />
                    <span>&ldquo;{filters.searchQuery}&rdquo;</span>
                </Chip>
            )}
            {filters.selectedStatus !== 'all' && (
                <Chip onClear={() => filters.setSelectedStatus('all')}>
                    <span className="capitalize">{filters.selectedStatus}</span>
                </Chip>
            )}
            {isAdmin && filters.selectedBranchId && (
                <Chip onClear={() => filters.setSelectedBranchId('')}>
                    <Building2 size={11} />
                    <span>{branchLabel(filters.selectedBranchId)}</span>
                </Chip>
            )}
            {filters.filterCategory && (
                <Chip onClear={() => filters.setFilterCategory('')}>
                    <span>{filters.filterCategory}</span>
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
                {visibleCount} of {totalCount}
            </span>
        </div>
    );
}
