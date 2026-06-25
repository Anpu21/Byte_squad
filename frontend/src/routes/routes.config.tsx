import { createRoutesFromElements, Navigate, Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import {
    ProtectedRoute,
    PublicRoute,
    RequireRole,
    FirstSetupOnly,
} from './guards';
import { SmartRedirect } from './redirects';
import { ChangePasswordPage } from '@/features/change-password';
import { BranchSelectionPage } from '@/features/branch-selection';
import { NotFoundPage } from '@/features/not-found';
import { authRoutes } from './config/auth.routes';
import { dashboardRoutes } from './config/dashboard.routes';
import { inventoryRoutes } from './config/inventory.routes';
import { salesRoutes } from './config/sales.routes';
import { accountingRoutes } from './config/accounting.routes';
import { peopleRoutes } from './config/people.routes';
import { transfersRoutes } from './config/transfers.routes';
import {
    customerProtectedRoutes,
    customerPublicRoutes,
} from './config/customer.routes';

/**
 * The full route tree. Guards (`PublicRoute` / `ProtectedRoute` / `RequireRole`)
 * and layouts (`AuthLayout` / `DashboardLayout` / `CustomerLayout`) are
 * `<Outlet>` layout-routes, so the dashboard chrome mounts once and persists
 * across navigations; per-route role-gating lives in the domain fragments under
 * `config/`. Breadcrumbs come from each route's `handle.crumbs`.
 */
export const routes = createRoutesFromElements(
    <Route>
        {/* Root → role-aware redirect (does its own auth check) */}
        <Route index element={<SmartRedirect />} />

        {/* Public auth screens — bounce already-signed-in users */}
        <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>{authRoutes}</Route>
        </Route>

        {/* Authenticated app */}
        <Route element={<ProtectedRoute />}>
            {/* Protected, no chrome */}
            <Route
                path={FRONTEND_ROUTES.CHANGE_PASSWORD}
                element={<ChangePasswordPage />}
                handle={{ crumbs: ['Change password'] }}
            />

            {/* First-run: customer must pick a branch (auth layout) */}
            <Route element={<AuthLayout />}>
                <Route element={<RequireRole roles={[UserRole.CUSTOMER]} />}>
                    <Route element={<FirstSetupOnly />}>
                        <Route
                            path={FRONTEND_ROUTES.SELECT_BRANCH}
                            element={<BranchSelectionPage />}
                        />
                    </Route>
                </Route>
            </Route>

            {/* Legacy branch paths → unified hub (no chrome; redirect only) */}
            <Route
                path={FRONTEND_ROUTES.BRANCHES_HUB}
                element={<Navigate to={FRONTEND_ROUTES.BRANCHES} replace />}
            />
            <Route
                path={FRONTEND_ROUTES.BRANCH_COMPARE}
                element={
                    <Navigate
                        to={`${FRONTEND_ROUTES.BRANCHES}?tab=compare&view=summary`}
                        replace
                    />
                }
            />
            <Route
                path={FRONTEND_ROUTES.BRANCH_MANAGEMENT}
                element={<Navigate to={FRONTEND_ROUTES.BRANCHES} replace />}
            />

            {/* Dashboard workspace — shared chrome, persists across navigation */}
            <Route element={<DashboardLayout />}>
                {dashboardRoutes}
                {inventoryRoutes}
                {salesRoutes}
                {accountingRoutes}
                {peopleRoutes}
                {transfersRoutes}
            </Route>

            {/* Customer storefront (login required) */}
            {customerProtectedRoutes}
        </Route>

        {/* Public order confirmation — no guard (the code is the credential) */}
        {customerPublicRoutes}

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
    </Route>,
);
