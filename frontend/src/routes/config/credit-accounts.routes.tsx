import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { CreditAccountsPage } from '@/features/credit-accounts';

/** Customer store-credit ("khata") hub — wrapped by `DashboardLayout`. */
export const creditAccountsRoutes = (
    <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
        <Route
            path={FRONTEND_ROUTES.CREDIT_ACCOUNTS}
            element={<CreditAccountsPage />}
            handle={{ crumbs: ['Finance', 'Store credit'] }}
        />
    </Route>
);
