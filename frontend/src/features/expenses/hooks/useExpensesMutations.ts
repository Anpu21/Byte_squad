import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import { ExpenseStatus } from '@/constants/enums';

interface ReviewArgs {
    id: string;
    action: 'approved' | 'rejected';
    note?: string;
}

export function useExpensesMutations() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all() });

    const deleteMutation = useMutation({
        mutationFn: accountingService.deleteExpense,
        onSuccess: invalidate,
    });

    const reviewMutation = useMutation({
        mutationFn: ({ id, action, note }: ReviewArgs) =>
            accountingService.reviewExpense(id, {
                status:
                    action === 'approved'
                        ? ExpenseStatus.APPROVED
                        : ExpenseStatus.REJECTED,
                note: note || undefined,
            }),
        onSuccess: invalidate,
    });

    const confirmAndDelete = async (id: string): Promise<boolean> => {
        const ok = await confirm({
            title: 'Delete expense?',
            body: 'This action cannot be undone.',
            confirmLabel: 'Delete expense',
            tone: 'danger',
        });
        if (!ok) return false;
        await deleteMutation.mutateAsync(id);
        return true;
    };

    return {
        confirmAndDelete,
        reviewExpense: (args: ReviewArgs) => reviewMutation.mutateAsync(args),
        invalidate,
        deleteError: deleteMutation.error,
        reviewError: reviewMutation.error,
    };
}
