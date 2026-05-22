import { Search, X } from 'lucide-react';
import { STOCK_OPTIONS } from '../lib/stock-key';

interface ActiveFilterChipsProps {
    search: string;
    setSearch: (value: string) => void;
    stockStatus: string;
    setStockStatus: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    onResetAll: () => void;
    totalMatches: number;
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
    search,
    setSearch,
    stockStatus,
    setStockStatus,
    category,
    setCategory,
    onResetAll,
    totalMatches,
}: ActiveFilterChipsProps) {
    const hasActive = search !== '' || stockStatus !== '' || category !== '';
    if (!hasActive) return null;

    const stockLabel =
        STOCK_OPTIONS.find((o) => o.value === stockStatus)?.label ?? stockStatus;

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
            {search && (
                <Chip onClear={() => setSearch('')}>
                    <Search size={11} />
                    <span>&ldquo;{search}&rdquo;</span>
                </Chip>
            )}
            {stockStatus && (
                <Chip onClear={() => setStockStatus('')}>
                    <span>{stockLabel}</span>
                </Chip>
            )}
            {category && (
                <Chip onClear={() => setCategory('')}>
                    <span>{category}</span>
                </Chip>
            )}
            <button
                type="button"
                onClick={onResetAll}
                className="text-xs text-text-3 hover:text-text-1 underline-offset-4 hover:underline transition-colors"
            >
                Reset all
            </button>
            <span className="ml-auto text-xs text-text-3">
                {totalMatches} matches
            </span>
        </div>
    );
}
