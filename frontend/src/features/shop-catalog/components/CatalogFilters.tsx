import { Search } from 'lucide-react';

interface CatalogFiltersProps {
    search: string;
    setSearch: (v: string) => void;
}

export function CatalogFilters({ search, setSearch }: CatalogFiltersProps) {
    return (
        <div className="mb-4">
            <div className="relative">
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
        </div>
    );
}
