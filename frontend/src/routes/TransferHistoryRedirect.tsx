import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';

export function TransferHistoryRedirect() {
    const { user } = useAuth();
    const base =
        user?.role === UserRole.ADMIN
            ? FRONTEND_ROUTES.ADMIN_TRANSFERS
            : FRONTEND_ROUTES.TRANSFERS;
    return <Navigate to={`${base}?tab=history`} replace />;
}
