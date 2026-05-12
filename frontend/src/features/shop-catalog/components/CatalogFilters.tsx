import { Search } from 'lucide-react';
import type { IShopBranch } from '@/types';

interface CatalogFiltersProps {
    branches: IShopBranch[];
    branchId: string;
    onBranchChange: (id: string) => void;
    search: string;
    setSearch: (v: string) => void;
    category: string;
    setCategory: (v: string) => void;
    categories: string[];
}

export function CatalogFilters({
    branches,
    branchId,
    onBranchChange,
    search,
    setSearch,
    category,
    setCategory,
    categories,
}: CatalogFiltersProps) {
    const selectClass =
        'bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary';

    return (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <select
                value={branchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className={selectClass}
            >
                {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                        {b.name}
                    </option>
                ))}
            </select>
            <div className="relative flex-1">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products…"
                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-1 focus:outline-none focus:border-primary"
                />
            </div>
            <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={selectClass}
            >
                <option value="">All categories</option>
                {categories.map((c) => (
                    <option key={c} value={c}>
                        {c}
                    </option>
                ))}
            </select>
        </div>
    );
}
