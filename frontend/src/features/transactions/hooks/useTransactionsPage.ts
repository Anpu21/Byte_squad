import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import type { ITransactionRow } from '../lib/format';

/**
 * Transactions page model.
 *
 * Phase 1 of the Shanel POS port deletes the legacy `posService`. Until
 * Phase 7 rewires this list against the new POS read endpoints we return
 * an empty envelope so the page renders its zero state without crashing.
 * The `branch`-scope branch in the previous implementation also fell out;
 * Phase 7 will reinstate per-branch summaries with the new endpoints.
 *
 * TODO Phase 7: rewire to new pos.service / transactions list endpoint.
 */
type TransactionsScope = 'system' | 'branch' | 'self';

export function useTransactionsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const scope: TransactionsScope = isAdmin ? 'system' : 'self';

    const data = {
        scope,
        today: { totalSales: 0, transactionCount: 0 },
        month: { totalSales: 0, transactionCount: 0 },
        year: { totalSales: 0, transactionCount: 0 },
        recentTransactions: [] as ITransactionRow[],
    };

    const scopeLabel =
        scope === 'system' ? 'All branches' : `${user?.firstName ?? 'Your'} sales`;
    const subtitle = `${scopeLabel} · 0 records`;

    return {
        data,
        isLoading: false,
        subtitle,
        showBranchCol: scope === 'system',
        showCashierCol: scope === 'system',
    };
}
