import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';
import type { IBranchWithMeta, IExpense } from '@/types';
import { useExpensesFilters } from './useExpensesFilters';
import { useExpensesQuery } from './useExpensesQuery';
import { useExpensesMutations } from './useExpensesMutations';
import { computeExpensesMetrics } from '../lib/expense-metrics';

export interface ReviewTarget {
    expense: IExpense;
    action: 'approved' | 'rejected';
}

export function useExpensesPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const filters = useExpensesFilters(isAdmin);
    const { confirmAndDelete, reviewExpense } = useExpensesMutations();

    const [showAddModal, setShowAddModal] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);

    const expensesQuery = useExpensesQuery({
        isAdmin,
        selectedBranchId: filters.selectedBranchId,
        selectedStatus: filters.selectedStatus,
    });
    const expenses = useMemo(
        () => expensesQuery.data ?? [],
        [expensesQuery.data],
    );

    const branchesQuery = useQuery<IBranchWithMeta[]>({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        enabled: isAdmin,
    });
    const branches = useMemo(
        () => branchesQuery.data ?? [],
        [branchesQuery.data],
    );

    const metrics = useMemo(() => computeExpensesMetrics(expenses), [expenses]);

    const filtered = useMemo(() => {
        const q = filters.searchQuery.trim().toLowerCase();
        return expenses.filter((e) => {
            if (filters.filterCategory && e.category !== filters.filterCategory)
                return false;
            if (
                q &&
                !e.description.toLowerCase().includes(q) &&
                !e.category.toLowerCase().includes(q)
            ) {
                return false;
            }
            return true;
        });
    }, [expenses, filters.filterCategory, filters.searchQuery]);

    const branchLabel = useCallback(
        (id: string) =>
            branches.find((b) => b.id === id)?.name ?? id.substring(0, 6),
        [branches],
    );

    const handleReview = useCallback(
        async (note: string) => {
            if (!reviewTarget) return;
            await reviewExpense({
                id: reviewTarget.expense.id,
                action: reviewTarget.action,
                note,
            });
            setReviewTarget(null);
        },
        [reviewTarget, reviewExpense],
    );

    const canAdd = Boolean(isAdmin || user?.branchId);
    const fetchError = expensesQuery.error ? 'Failed to load expenses' : null;

    return {
        user,
        isAdmin,
        filters,
        expenses,
        filtered,
        branches,
        metrics,
        branchLabel,
        isLoading: expensesQuery.isLoading,
        fetchError,
        canAdd,
        showAddModal,
        setShowAddModal,
        reviewTarget,
        setReviewTarget,
        handleReview,
        handleDelete: (id: string) => void confirmAndDelete(id),
    };
}
