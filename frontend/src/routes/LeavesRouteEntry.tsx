import { AdminLeavesPage } from '@/pages/admin/AdminLeavesPage';
import { AdminHrRedirect } from './AdminHrRedirect';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';

/**
 * `/admin/leaves` is one route shared by three roles.
 *  - Cashier: renders the standalone Leaves page (their only HR surface).
 *  - Admin / Manager: redirects to the unified HR workspace's Leaves tab.
 */
export function LeavesRouteEntry() {
    const { user } = useAuth();
    if (user?.role === UserRole.CASHIER) {
        return <AdminLeavesPage />;
    }
    return <AdminHrRedirect tab="leaves" />;
}
