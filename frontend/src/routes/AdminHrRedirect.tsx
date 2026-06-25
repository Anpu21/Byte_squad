import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { AdminHrTab } from '@/features/admin-hr';

interface AdminHrRedirectProps {
    tab: AdminHrTab;
}

export function AdminHrRedirect({ tab }: AdminHrRedirectProps) {
    const search = tab === 'employees' ? '' : `?tab=${tab}`;
    return <Navigate to={`${FRONTEND_ROUTES.ADMIN_HR}${search}`} replace />;
}
