import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';

export function FirstSetupOnly({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    if (user?.branchId) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_PROFILE} replace />;
    }
    return <>{children}</>;
}
