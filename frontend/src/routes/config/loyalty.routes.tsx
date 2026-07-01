import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { CashierLoyaltyPage } from '@/features/loyalty-members';

/** Cashier-facing loyalty-members counter — wrapped by `DashboardLayout`. */
export const loyaltyRoutes = (
    <Route element={<RequireRole roles={[UserRole.CASHIER]} />}>
        <Route
            path={FRONTEND_ROUTES.CASHIER_LOYALTY}
            element={<CashierLoyaltyPage />}
            handle={{ crumbs: ['Sales', 'Loyalty'] }}
        />
    </Route>
);
