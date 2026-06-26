import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { DashboardPage } from '@/features/admin-dashboard';
import { CashierDashboardPage } from '@/features/cashier-dashboard';
import { WorkerDashboardPage } from '@/features/worker-dashboard';

/** Role landing dashboards — wrapped by `DashboardLayout` in the aggregator. */
export const dashboardRoutes = (
    <>
        <Route
            path={FRONTEND_ROUTES.DASHBOARD}
            element={<DashboardPage />}
            handle={{ crumbs: ['Dashboard'] }}
        />
        <Route
            path={FRONTEND_ROUTES.CASHIER_DASHBOARD}
            element={<CashierDashboardPage />}
            handle={{ crumbs: ['Cashier'] }}
        />
        <Route element={<RequireRole roles={[UserRole.WORKER]} />}>
            <Route
                path={FRONTEND_ROUTES.WORKER_DASHBOARD}
                element={<WorkerDashboardPage />}
            />
        </Route>
    </>
);
