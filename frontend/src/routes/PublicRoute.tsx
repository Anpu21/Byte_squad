import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';

interface PublicRouteProps {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    const { isAuthenticated, user } = useAuth();

    if (isAuthenticated && user) {
        // Send each role to its proper home — bouncing every authenticated
        // user to /dashboard would let cashiers/customers land on the admin view.
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

    return <>{children}</>;
}
