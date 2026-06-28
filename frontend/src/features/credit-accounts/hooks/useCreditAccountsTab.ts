import { useTabParam } from '@/hooks/useTabParam';

export type CreditAccountsTab = 'approvals' | 'accounts';

/**
 * URL-synced active tab for the Credit Accounts hub, clamped to the role-allowed
 * keys (so a deep-link to a hidden tab falls back to the first allowed one).
 */
export function useCreditAccountsTab(allowed: CreditAccountsTab[]) {
  return useTabParam<CreditAccountsTab>({
    valid: allowed.length > 0 ? allowed : ['approvals'],
    fallback: allowed[0] ?? 'approvals',
  });
}
