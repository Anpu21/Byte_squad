import { LeavesView } from '@/features/admin-leaves';
import { AdminHrRedirect } from './AdminHrRedirect';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';

/**
 * `/admin/leaves` is one route shared by three roles.
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
