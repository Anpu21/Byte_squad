import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { IInventoryMatrixBranchColumn } from '@/types';
import type { AdminInventoryFiltersState } from '../hooks/useAdminInventoryFilters';
import { FilterSearch } from './FilterSearch';
import { FilterBranch } from './FilterBranch';
import { FilterStockStatus } from './FilterStockStatus';
import { FilterCategory } from './FilterCategory';

interface InventoryFilterRailProps {
    branches: IInventoryMatrixBranchColumn[];
    categories: string[];
    filters: AdminInventoryFiltersState;
}

export function InventoryFilterRail({
    branches,
    categories,
    filters,
}: InventoryFilterRailProps) {
    return (
        <aside className="w-full lg:w-60 lg:flex-shrink-0">
            <Card className="p-4">
                <FilterSearch
                    value={filters.searchInput}
                    onChange={filters.setSearchInput}
                />
                <div className="border-t border-border pt-4 mt-4">
                    <FilterBranch
                        branches={branches}
                        selected={filters.branchId}
                        onChange={filters.setBranchId}
                    />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                    <FilterStockStatus
                        selected={filters.stockStatus}
                        onChange={filters.setStockStatus}
                    />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                    <FilterCategory
                        categories={categories}
                        selected={filters.category}
                        onChange={filters.setCategory}
                    />
                </div>
                <div className="border-t border-border pt-4 mt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={filters.resetFilters}
                        disabled={!filters.hasActiveFilter}
                    >
                        Reset all
                    </Button>
                </div>
            </Card>
        </aside>
    );
}
