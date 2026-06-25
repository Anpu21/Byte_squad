import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';

/**
 * Auth gate as an `<Outlet>` layout-route. Bounces anonymous users to login and
 * first-login users to the change-password screen. Role checks live in
 * {@link RequireRole}, nested below the shared layout so the layout persists.
 */
export function ProtectedRoute() {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <Navigate
                to={FRONTEND_ROUTES.LOGIN}
                state={{ from: location }}
                replace
            />
        );
    }
    if (
        user?.isFirstLogin &&
        location.pathname !== FRONTEND_ROUTES.CHANGE_PASSWORD
    ) {
        return <Navigate to={FRONTEND_ROUTES.CHANGE_PASSWORD} replace />;
    }
    return <Outlet />;
}

/**
 * Role gate as an `<Outlet>` layout-route. A signed-in user whose role isn't in
 * `roles` is sent to root (which re-routes them to their own home). The `user &&`
 * guard preserves the old behaviour of not redirecting during the brief
 * auth-hydration window where `user` is still null.
 */
export function RequireRole({ roles }: { roles: UserRole[] }) {
    const { user } = useAuth();
    if (user && !roles.includes(user.role as UserRole)) {
        return <Navigate to={FRONTEND_ROUTES.ROOT} replace />;
    }
    return <Outlet />;
}

/**
 * Public gate for the auth screens — sends an already signed-in user to their
 * role's home instead of showing login/signup. (Workers fall to the default →
 * dashboard, preserving the prior behaviour.)
 */
export function PublicRoute() {
    const { isAuthenticated, user } = useAuth();
    if (isAuthenticated && user) {
        switch (user.role) {
            case UserRole.CASHIER:
                return (
                    <Navigate to={FRONTEND_ROUTES.CASHIER_DASHBOARD} replace />
                );
            case UserRole.CUSTOMER:
                return user.branchId ? (
                    <Navigate to={FRONTEND_ROUTES.SHOP} replace />
                ) : (
                    <Navigate to={FRONTEND_ROUTES.SELECT_BRANCH} replace />
                );
            default:
                return <Navigate to={FRONTEND_ROUTES.DASHBOARD} replace />;
        }
    }
    return <Outlet />;
}

/**
 * First-run gate for the customer branch-selection screen: a customer who
 * already has a branch is sent to their profile instead.
 */
export function FirstSetupOnly() {
    const { user } = useAuth();
    if (user?.branchId) {
        return <Navigate to={FRONTEND_ROUTES.SHOP_PROFILE} replace />;
    }
    return <Outlet />;
}
