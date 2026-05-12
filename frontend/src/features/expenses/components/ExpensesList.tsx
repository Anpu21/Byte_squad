import { Plus, Wallet } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import type { IExpense } from '@/types';
import { ExpenseRow } from './ExpenseRow';

interface ExpensesListProps {
    expenses: IExpense[];
    isLoading: boolean;
    hasActiveFilter: boolean;
    canAdd: boolean;
    isAdmin: boolean;
    currentUserBranchId: string | null | undefined;
    showBranch: boolean;
    branchLabel: (id: string) => string;
    onAdd: () => void;
    onResetFilters: () => void;
    onApprove: (expense: IExpense) => void;
    onReject: (expense: IExpense) => void;
    onDelete: (id: string) => void;
}

export function ExpensesList({
    expenses,
    isLoading,
    hasActiveFilter,
    canAdd,
    isAdmin,
    currentUserBranchId,
    showBranch,
    branchLabel,
    onAdd,
    onResetFilters,
    onApprove,
    onReject,
    onDelete,
}: ExpensesListProps) {
    if (isLoading) {
        return (
            <ul className="flex flex-col gap-2">
                {[...Array(5)].map((_, i) => (
                    <li
                        key={i}
                        className="h-14 bg-surface-2 rounded-md animate-pulse"
                    />
                ))}
            </ul>
        );
    }

    if (expenses.length === 0) {
        return (
            <Card>
                <EmptyState
                    icon={<Wallet size={20} />}
                    title="No expenses recorded"
                    description={
                        hasActiveFilter
                            ? 'No expenses match the current filters.'
                            : 'Start tracking your spending by adding your first expense.'
                    }
                    action={
                        hasActiveFilter ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onResetFilters}
                                size="md"
                            >
                                Reset filters
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={onAdd}
                                disabled={!canAdd}
                                size="md"
                            >
                                <Plus size={14} /> Add expense
                            </Button>
                        )
                    }
                />
            </Card>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {expenses.map((expense) => (
                <li key={expense.id}>
                    <ExpenseRow
                        expense={expense}
                        isAdmin={isAdmin}
                        currentUserBranchId={currentUserBranchId}
                        showBranch={showBranch}
                        branchLabel={branchLabel}
                        onApprove={onApprove}
                        onReject={onReject}
                        onDelete={onDelete}
                    />
                </li>
            ))}
        </ul>
    );
}
