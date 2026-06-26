import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { AdminInventoryPage } from '@/features/admin-inventory';
import { InventoryListPage } from '@/features/inventory-list';
import { LeavesView } from '@/features/admin-leaves';
import { AdminHrRedirect } from './redirects';

/**
 * Inventory "list" tab body — the admin stock board vs the manager list. Used
 * inside `InventoryWorkspacePage`, so it renders a page (not an `<Outlet>`).
 */
export function InventoryByRole() {
    const { user } = useAuth();
    return user?.role === UserRole.ADMIN ? (
        <AdminInventoryPage />
    ) : (
        <InventoryListPage />
    );
}

/**
 * `/admin/leaves` is one route shared by three roles:
 *  - Cashier: renders the standalone Leaves view (their only HR surface).
 *  - Admin / Manager: redirects to the unified HR workspace's Leaves tab.
 */
export function LeavesRouteEntry() {
    const { user } = useAuth();
    if (user?.role === UserRole.CASHIER) {
        return (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LeavesView />
            </div>
        );
    }
    return <AdminHrRedirect tab="leaves" />;
}
