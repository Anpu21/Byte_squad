import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface PublicRouteProps {
    children: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />;
    }

    return <>{children}</>;
}
