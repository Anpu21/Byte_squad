import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FilterSearch } from './FilterSearch';
import { FilterStockStatus } from './FilterStockStatus';
import { FilterCategory } from './FilterCategory';

interface InventoryFilterRailProps {
    search: string;
    onSearchChange: (value: string) => void;
    stockStatus: string;
    onStockStatusChange: (value: string) => void;
    category: string;
    onCategoryChange: (value: string) => void;
    categories: string[];
    hasActiveFilter: boolean;
    onReset: () => void;
}

export function InventoryFilterRail({
    search,
    onSearchChange,
    stockStatus,
    onStockStatusChange,
    category,
    onCategoryChange,
    categories,
    hasActiveFilter,
    onReset,
}: InventoryFilterRailProps) {
    return (
        <aside className="w-full lg:w-60 lg:flex-shrink-0">
            <Card className="p-4">
                <FilterSearch value={search} onChange={onSearchChange} />
                <div className="border-t border-border pt-4 mt-4">
                    <FilterStockStatus
                        selected={stockStatus}
                        onChange={onStockStatusChange}
                    />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                    <FilterCategory
                        categories={categories}
                        selected={category}
                        onChange={onCategoryChange}
                    />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={onReset}
                        disabled={!hasActiveFilter}
                    >
                        Reset all
                    </Button>
                </div>
            </Card>
        </aside>
    );
}
