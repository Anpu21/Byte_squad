import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import type { SalesTab } from '@/features/sales';
import type { AccountingTab } from '@/features/accounting/hooks/useAccountingTab';
import type { InventoryTab } from '@/features/admin-inventory/hooks/useInventoryTab';
import type { AdminHrTab } from '@/features/admin-hr';

/**
 * Root smart-redirect: sends each signed-in role to its home; anonymous → login.
 * Mounted on the `index` route, so it runs its own auth check (not wrapped by a
 * guard).
 */
export function SmartRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
    }
    switch (user.role) {
        case UserRole.CASHIER:
            return <Navigate to={FRONTEND_ROUTES.CASHIER_DASHBOARD} replace />;
        case UserRole.CUSTOMER:
            return user.branchId ? (
                <Navigate to={FRONTEND_ROUTES.SHOP} replace />
            ) : (
                <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />
            );
        case UserRole.WORKER:
            return <Navigate to={FRONTEND_ROUTES.WORKER_DASHBOARD} replace />;
        default:
            return <Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />;
    }
}

/**
 * Builds a redirect component that maps a legacy standalone path onto a unified
 * tabbed hub with the matching tab selected (e.g. `/transactions` →
 * `/sales?tab=transactions`). The hub's default tab is kept out of the URL so
 * canonical links stay clean. `param` supports namespaced cases (e.g.
 * `transferTab`).
 */
function createTabRedirect<T extends string>(
    route: string,
    defaultTab: T,
    param = 'tab',
) {
    return function TabRedirect({ tab }: { tab: T }) {
        const search = tab === defaultTab ? '' : `?${param}=${tab}`;
        return <Navigate to={`${route}${search}`} replace />;
    };
}

export const SalesRedirect = createTabRedirect<SalesTab>(
    FRONTEND_ROUTES.SALES,
    'transactions',
);
export const AccountingRedirect = createTabRedirect<AccountingTab>(
    FRONTEND_ROUTES.ACCOUNTING,
    'ledger',
);
export const InventoryRedirect = createTabRedirect<InventoryTab>(
    FRONTEND_ROUTES.INVENTORY,
    'list',
);
export const AdminHrRedirect = createTabRedirect<AdminHrTab>(
    FRONTEND_ROUTES.ADMIN_HR,
    'employees',
);

/** `/transfers/history` → the role-correct transfers workspace, History tab. */
export function TransferHistoryRedirect() {
    const { user } = useAuth();
    const base =
        user?.role === UserRole.ADMIN
            ? FRONTEND_ROUTES.ADMIN_TRANSFERS
            : FRONTEND_ROUTES.TRANSFERS;
    return <Navigate to={`${base}?transferTab=history`} replace />;
}

/** Legacy `/shop/requests/:code` → canonical `/shop/orders/:code`. */
export function LegacyOrderConfirmationRedirect() {
    const { code } = useParams<{ code: string }>();
    const target = FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION.replace(
        ':code',
        code ?? '',
    );
    return <Navigate to={target} replace />;
}

/** `/shop/groups/:id/analytics` → the group detail page's Analytics tab. */
export function GroupAnalyticsRedirect() {
    const { id } = useParams<{ id: string }>();
    const target = FRONTEND_ROUTES.SHOP_GROUP_DETAIL.replace(':id', id ?? '');
    return <Navigate to={`${target}?tab=analytics`} replace />;
}
