import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { CashierStoreCreditPage } from '@/features/credit-accounts';

/** Cashier-facing store-credit ("khata") counter — wrapped by `DashboardLayout`. */
export const storeCreditRoutes = (
    <Route element={<RequireRole roles={[UserRole.CASHIER]} />}>
        <Route
            path={FRONTEND_ROUTES.STORE_CREDIT}
            element={<CashierStoreCreditPage />}
            handle={{ crumbs: ['Sales', 'Store credit'] }}
        />
    </Route>
);
