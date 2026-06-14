import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { SalesTab } from '@/pages/sales/SalesPage';

interface SalesRedirectProps {
    tab: SalesTab;
}

/**
 * Maps a legacy standalone sales path (e.g. `/transactions`, `/admin/schemes`)
 * onto the unified Sales hub with the matching tab selected. Mirrors
 * `AccountingRedirect`.
 */
export function SalesRedirect({ tab }: SalesRedirectProps) {
    return <Navigate to={`${FRONTEND_ROUTES.SALES}?tab=${tab}`} replace />;
}
