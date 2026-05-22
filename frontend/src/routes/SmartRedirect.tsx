import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';

export function SmartRedirect() {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated || !user) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
    }
    switch (user.role) {
        case UserRole.CASHIER:
            return <Navigate to={FRONTEND_ROUTES.CASHIER_DASHBOARD} replace />;
        case UserRole.CUSTOMER:
            if (!user.branchId) {
                return <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />;
            }
            return <Navigate to={FRONTEND_ROUTES.SHOP} replace />;
        default:
            return <Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />;
    }
}
