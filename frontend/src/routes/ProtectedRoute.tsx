import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to={FRONTEND_ROUTES.LOGIN} state={{ from: location }} replace />;
    }

    // Redirect first-login users to change password page
    if (user?.isFirstLogin && location.pathname !== FRONTEND_ROUTES.CHANGE_PASSWORD) {
        return <Navigate to={FRONTEND_ROUTES.CHANGE_PASSWORD} replace />;
    }

    return <>{children}</>;
}
