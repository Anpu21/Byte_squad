import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { ICashierTransactionsSummary } from '@/types';

const REFETCH_INTERVAL = 30_000;

export function useTransactionsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery<ICashierTransactionsSummary>({
        queryKey: queryKeys.transactions.summary(isAdmin ? 'system' : 'self'),
        queryFn: isAdmin
            ? posService.getAllTransactions
            : posService.getMyTransactions,
        refetchInterval: REFETCH_INTERVAL,
    });

    const subtitle = useMemo(() => {
        const scopeLabel =
            data?.scope === 'system'
                ? 'All branches'
                : data?.scope === 'branch'
                  ? 'Branch sales'
                  : `${user?.firstName ?? 'Your'} sales`;
        return `${scopeLabel} · ${data?.recentTransactions.length ?? 0} records`;
    }, [data, user]);

    const showBranchCol = data?.scope === 'system';
    const showCashierCol = data?.scope === 'branch' || data?.scope === 'system';

    return { data, isLoading, subtitle, showBranchCol, showCashierCol };
}
