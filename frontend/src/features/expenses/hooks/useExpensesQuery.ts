import { useQuery } from '@tanstack/react-query';
import { accountingService } from '@/services/accounting.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IExpense } from '@/types';
import type { StatusFilter } from '../types/status-filter.type';

interface UseExpensesQueryArgs {
    isAdmin: boolean;
    selectedBranchId: string;
    selectedStatus: StatusFilter;
}

export function useExpensesQuery({
    isAdmin,
    selectedBranchId,
    selectedStatus,
}: UseExpensesQueryArgs) {
    const branchId = isAdmin && selectedBranchId ? selectedBranchId : null;
    const status = selectedStatus !== 'all' ? selectedStatus : null;

    return useQuery<IExpense[]>({
        queryKey: queryKeys.expenses.list({ branchId, status }),
        queryFn: () =>
            accountingService.getExpenses({
                branchId: branchId ?? undefined,
                status: status ?? undefined,
            }),
    });
}
