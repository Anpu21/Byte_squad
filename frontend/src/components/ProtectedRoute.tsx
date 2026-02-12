import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

/**
 * Route wrapper that redirects to /login if the user is not authenticated.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { token } = useSelector((state: RootState) => state.auth);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
