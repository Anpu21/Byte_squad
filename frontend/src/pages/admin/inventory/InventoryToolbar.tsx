import { Search, X } from 'lucide-react';
import Segmented from '@/components/ui/Segmented';

export type InventoryView = 'all' | 'low_stock' | 'out_of_stock' | 'healthy';

export interface ActiveFilter {
    label: string;
    clear: () => void;
}

interface InventoryToolbarProps {
    searchInput: string;
    onSearchInputChange: (v: string) => void;
    category: string;
    categories: string[];
    onCategoryChange: (v: string) => void;
    view: InventoryView;
    onViewChange: (v: InventoryView) => void;
    visibleCount: number;
    totalCount: number;
    activeFilters: ActiveFilter[];
    onClearAll: () => void;
}

const VIEW_OPTIONS: { value: InventoryView; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'low_stock', label: 'Low stock' },
    { value: 'out_of_stock', label: 'Out of stock' },
    { value: 'healthy', label: 'Healthy' },
];

export default function InventoryToolbar({
    searchInput,
    onSearchInputChange,
    category,
    categories,
    onCategoryChange,
    view,
    onViewChange,
    visibleCount,
    totalCount,
    activeFilters,
    onClearAll,
}: InventoryToolbarProps) {
    return (
        <div className="bg-surface border border-border rounded-md shadow-xs mb-5">
            <div className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px] relative">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 pointer-events-none"
                    />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => onSearchInputChange(e.target.value)}
                        placeholder="Search product name or barcode…"
                        className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 transition-colors"
                    />
                </div>

                <select
                    value={category}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="h-9 px-3 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors"
                >
                    <option value="">All categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>

                <Segmented<InventoryView>
                    value={view}
                    options={VIEW_OPTIONS}
                    onChange={onViewChange}
                />

                <span className="ml-auto text-[11px] uppercase tracking-widest text-text-3 font-semibold whitespace-nowrap">
                    {visibleCount} of {totalCount}
                </span>
            </div>

            {activeFilters.length > 0 && (
                <div className="px-3 pb-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
                    {activeFilters.map((f, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={f.clear}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                        >
                            <span>{f.label}</span>
                            <X size={12} className="opacity-70" />
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="text-xs text-text-3 hover:text-text-1 underline-offset-4 hover:underline transition-colors ml-1"
                    >
                        Reset all
                    </button>
                </div>
            )}
        </div>
    );
}
