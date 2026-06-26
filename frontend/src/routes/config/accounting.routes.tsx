import { Route } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { UserRole } from '@/constants/enums';
import { RequireRole } from '../guards';
import { AccountingRedirect } from '../redirects';
import { AccountingPage } from '@/features/accounting';
import { AuditLogPage } from '@/features/audit';
import { ReportsHubPage } from '@/features/reports';

/** Accounting hub + legacy redirects — wrapped by `DashboardLayout`. */
export const accountingRoutes = (
    <>
        <Route element={<RequireRole roles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
            <Route
                path={FRONTEND_ROUTES.ACCOUNTING}
                element={<AccountingPage />}
                handle={{ crumbs: ['Accounting'] }}
            />
            <Route
                path={FRONTEND_ROUTES.RECEIVABLES}
                element={<AccountingRedirect tab="receivables" />}
                handle={{ crumbs: ['Accounting', 'Receivables'] }}
            />
            <Route
                path={FRONTEND_ROUTES.EXPENSES}
                element={<AccountingRedirect tab="expenses" />}
                handle={{ crumbs: ['Accounting', 'Expenses'] }}
            />
            <Route
                path={FRONTEND_ROUTES.REPORTS}
                element={<ReportsHubPage />}
                handle={{ crumbs: ['Finance', 'Reports'] }}
            />
        </Route>
        <Route element={<RequireRole roles={[UserRole.ADMIN]} />}>
            <Route
                path={FRONTEND_ROUTES.LEDGER}
                element={<AccountingRedirect tab="ledger" />}
                handle={{ crumbs: ['Accounting', 'Ledger'] }}
            />
            <Route
                path={FRONTEND_ROUTES.FINANCIAL_REPORTS}
                element={<AccountingRedirect tab="reports" />}
                handle={{ crumbs: ['Accounting', 'Reports'] }}
            />
            <Route
                path={FRONTEND_ROUTES.PROFIT_LOSS}
                element={<AccountingRedirect tab="profit-loss" />}
                handle={{ crumbs: ['Accounting', 'Profit & Loss'] }}
            />
            <Route
                path={FRONTEND_ROUTES.ADMIN_AUDIT}
                element={<AuditLogPage />}
                handle={{ crumbs: ['System', 'Audit'] }}
            />
        </Route>
    </>
);
