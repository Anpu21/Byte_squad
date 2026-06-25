import { Navigate, Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { SalesRedirect } from '../redirects';
import { PosPage } from '@/features/pos';
import { SalesPage } from '@/features/sales';

/** POS + Sales hub + legacy redirects — wrapped by `DashboardLayout`. */
export const salesRoutes = (
    <>
        <Route element={<RequireRole roles={[UserRole.CASHIER]} />}>
            <Route
                path={FRONTEND_ROUTES.POS}
                element={<PosPage />}
                handle={{ crumbs: ['Sales', 'POS'] }}
            />
            <Route
                path={FRONTEND_ROUTES.SCAN_ORDER}
                element={<Navigate to={FRONTEND_ROUTES.POS} replace />}
            />
            <Route
                path={FRONTEND_ROUTES.SCAN_ORDER_LEGACY}
                element={<Navigate to={FRONTEND_ROUTES.POS} replace />}
            />
        </Route>
        <Route
            element={
                <RequireRole
                    roles={[UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER]}
                />
            }
        >
            <Route
                path={FRONTEND_ROUTES.SALES}
                element={<SalesPage />}
                handle={{ crumbs: ['Sales'] }}
            />
            <Route
                path={FRONTEND_ROUTES.TRANSACTIONS}
                element={<SalesRedirect tab="transactions" />}
                handle={{ crumbs: ['Sales', 'Transactions'] }}
            />
            <Route
                path={FRONTEND_ROUTES.CUSTOMER_ORDERS}
                element={<SalesRedirect tab="orders" />}
                handle={{ crumbs: ['People', 'Customer orders'] }}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.ADMIN_SCHEMES}
                element={<SalesRedirect tab="schemes" />}
                handle={{ crumbs: ['Operations', 'Schemes'] }}
            />
        </Route>
    </>
);
