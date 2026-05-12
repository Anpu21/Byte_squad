import { useExpensesPage } from '@/features/expenses/hooks/useExpensesPage';
import ExpensesHeader from '@/features/expenses/components/ExpensesHeader';
import ExpensesFilterRail from '@/features/expenses/components/ExpensesFilterRail';
import ExpensesHeroKpi from '@/features/expenses/components/ExpensesHeroKpi';
import ExpensesSecondaryMetrics from '@/features/expenses/components/ExpensesSecondaryMetrics';
import ExpensesActiveFilterChips from '@/features/expenses/components/ExpensesActiveFilterChips';
import ExpensesList from '@/features/expenses/components/ExpensesList';
import AddExpenseModal from './AddExpenseModal';
import ReviewExpenseModal from './ReviewExpenseModal';

export function ExpensesPage() {
    const p = useExpensesPage();
    const { filters, metrics } = p;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExpensesHeader
                isAdmin={p.isAdmin}
                canAdd={p.canAdd}
                selectedBranchLabel={
                    filters.selectedBranchId
                        ? p.branchLabel(filters.selectedBranchId)
                        : null
                }
                onAdd={() => p.setShowAddModal(true)}
            />

            {p.fetchError && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {p.fetchError}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-5">
                <ExpensesFilterRail
                    filters={filters}
                    expenses={p.expenses}
                    categories={metrics.categories}
                    branches={p.branches}
                    isAdmin={p.isAdmin}
                />

                <div className="flex-1 min-w-0">
                    <ExpensesHeroKpi
                        thisMonthTotal={metrics.thisMonthTotal}
                        monthOverMonthDelta={metrics.monthOverMonthDelta}
                        last14DaysTotals={metrics.last14DaysTotals}
                    />
                    <ExpensesSecondaryMetrics
                        total={p.expenses.length}
                        pendingCount={metrics.pendingCount}
                        approvedCount={metrics.approvedCount}
                        largestCategory={metrics.largestCategory}
                    />
                    <ExpensesActiveFilterChips
                        filters={filters}
                        isAdmin={p.isAdmin}
                        visibleCount={p.filtered.length}
                        totalCount={p.expenses.length}
                        branchLabel={p.branchLabel}
                    />
                    <ExpensesList
                        expenses={p.filtered}
                        isLoading={p.isLoading}
                        hasActiveFilter={filters.hasActiveFilter}
                        canAdd={p.canAdd}
                        isAdmin={p.isAdmin}
                        currentUserBranchId={p.user?.branchId}
                        showBranch={p.isAdmin && filters.selectedBranchId === ''}
                        branchLabel={p.branchLabel}
                        onAdd={() => p.setShowAddModal(true)}
                        onResetFilters={filters.resetFilters}
                        onApprove={(e) => p.setReviewTarget({ expense: e, action: 'approved' })}
                        onReject={(e) => p.setReviewTarget({ expense: e, action: 'rejected' })}
                        onDelete={p.handleDelete}
                    />
                </div>
            </div>

            {p.showAddModal && (
                <AddExpenseModal
                    isAdmin={p.isAdmin}
                    defaultBranchId={p.user?.branchId ?? ''}
                    branches={p.branches}
                    onClose={() => p.setShowAddModal(false)}
                    onSaved={() => p.setShowAddModal(false)}
                />
            )}

            {p.reviewTarget && (
                <ReviewExpenseModal
                    expense={p.reviewTarget.expense}
                    action={p.reviewTarget.action}
                    onCancel={() => p.setReviewTarget(null)}
                    onConfirm={p.handleReview}
                />
            )}
        </div>
    );
}
