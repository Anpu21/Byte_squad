import { useTabParam } from '@/hooks/useTabParam';

export type AccountingTab =
    | 'ledger'
    | 'receivables'
    | 'reports'
    | 'expenses'
    | 'profit-loss';

/**
 * Active tab for the role-gated Accounting hub. `allowed` is the role-filtered
 * tab list; its first entry is the fallback so a role can never land on a tab
 * it isn't permitted to see. Thin wrapper over the shared {@link useTabParam}.
 */
export function useAccountingTab(allowed: AccountingTab[]) {
    return useTabParam<AccountingTab>({
        valid: allowed,
        fallback: allowed[0] ?? 'ledger',
    });
}
