import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { useTransactionsQuery } from '@/features/pos/hooks/useTransactionsQuery';
import type { ICashierTransactionsSummary } from '@/types';

interface UseTransactionsPageResult {
    data: ICashierTransactionsSummary | undefined;
    isLoading: boolean;
    subtitle: string;
    showBranchCol: boolean;
    showCashierCol: boolean;
}

function buildSubtitle(
    summary: ICashierTransactionsSummary | undefined,
    firstName: string | undefined,
): string {
    const count = summary?.recentTransactions.length ?? 0;
    const scope = summary?.scope;
    let label: string;
    if (scope === 'system') label = 'All branches';
    else if (scope === 'branch') label = 'Branch sales';
    else label = `${firstName ?? 'Your'} sales`;
    return `${label} · ${count} records`;
}

/**
 * Transactions page model. Routes the query scope by role: admin pulls the
 * system-wide rollup, while managers and cashiers pull `/pos/my-transactions`
 * (the server then narrows to branch or cashier scope from the JWT). Column
 * visibility is driven by the scope the server actually returned.
 */
export function useTransactionsPage(): UseTransactionsPageResult {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const query = useTransactionsQuery({ scope: isAdmin ? 'all' : 'mine' });

    const data = query.data;
    const showBranchCol = data?.scope === 'system';
    const showCashierCol = data?.scope === 'system' || data?.scope === 'branch';
    const subtitle = useMemo(
        () => buildSubtitle(data, user?.firstName),
        [data, user?.firstName],
    );

    return {
        data,
        isLoading: query.isLoading,
        subtitle,
        showBranchCol,
        showCashierCol,
    };
}
