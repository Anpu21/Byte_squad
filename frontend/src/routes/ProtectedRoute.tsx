import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Redirect first-login users to change password page
    if (user?.isFirstLogin && location.pathname !== FRONTEND_ROUTES.CHANGE_PASSWORD) {
        return <Navigate to={FRONTEND_ROUTES.CHANGE_PASSWORD} replace />;
    }

    // Role-based gate: if allowedRoles is set, the user must match one of them
    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
        return <Navigate to={FRONTEND_ROUTES.ROOT} replace />;
    }

    return <>{children}</>;
}
