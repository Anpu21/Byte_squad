import { UserRole } from '@/constants/enums';
import { usePendingCreditAccounts } from '@/features/credit-accounts/hooks/usePendingCreditAccounts';

/**
 * Live "needs attention" counts for sidebar items, keyed by nav item id and gated
 * to the roles that can actually see each source — so we never fetch (or 403) for
 * a role without the page. Today: pending store-credit approvals for admins and
 * branch managers. This hook is the single throttle point if more badges are added.
 */
export function useSidebarBadges(
    role: UserRole | undefined,
): Record<string, number> {
    const canApproveCredit =
        role === UserRole.ADMIN || role === UserRole.MANAGER;

    const pendingCredit = usePendingCreditAccounts({ enabled: canApproveCredit });

    const badges: Record<string, number> = {};
    const pendingCount = pendingCredit.data?.length ?? 0;
    if (pendingCount > 0) badges['credit-accounts'] = pendingCount;
    return badges;
}
