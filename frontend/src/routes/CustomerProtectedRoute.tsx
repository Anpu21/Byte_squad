import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface CustomerProtectedRouteProps {
    children: ReactNode;
}

export default function CustomerProtectedRoute({
    children,
}: CustomerProtectedRouteProps) {
    const { isAuthenticated } = useCustomerAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <Navigate
                to={FRONTEND_ROUTES.SHOP_LOGIN}
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return <>{children}</>;
}
