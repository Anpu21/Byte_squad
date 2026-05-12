import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { IBranchWithMeta, IExpense } from '@/types';
import type { ExpensesFiltersState } from '../hooks/useExpensesFilters';
import ExpenseSearchFilter from './ExpenseSearchFilter';
import ExpenseStatusFilter from './ExpenseStatusFilter';
import ExpenseBranchFilter from './ExpenseBranchFilter';
import ExpenseCategoryFilter from './ExpenseCategoryFilter';

interface ExpensesFilterRailProps {
    filters: ExpensesFiltersState;
    expenses: IExpense[];
    categories: string[];
    branches: IBranchWithMeta[];
    isAdmin: boolean;
}

export default function ExpensesFilterRail({
    filters,
    expenses,
    categories,
    branches,
    isAdmin,
}: ExpensesFilterRailProps) {
    return (
        <aside className="w-full lg:w-60 lg:flex-shrink-0">
            <Card className="p-4">
                <ExpenseSearchFilter
                    value={filters.searchQuery}
                    onChange={filters.setSearchQuery}
                />
                <div className="border-t border-border pt-4 mt-4">
                    <ExpenseStatusFilter
                        expenses={expenses}
                        selected={filters.selectedStatus}
                        onChange={filters.setSelectedStatus}
                    />
                </div>
                {isAdmin && (
                    <div className="border-t border-border pt-4 mt-4">
                        <ExpenseBranchFilter
                            branches={branches}
                            selected={filters.selectedBranchId}
                            onChange={filters.setSelectedBranchId}
                        />
                    </div>
                )}
                <div className="border-t border-border pt-4 mt-4">
                    <ExpenseCategoryFilter
                        expenses={expenses}
                        categories={categories}
                        selected={filters.filterCategory}
                        onChange={filters.setFilterCategory}
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
