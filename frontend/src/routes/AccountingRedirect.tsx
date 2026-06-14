import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { AccountingTab } from '@/features/accounting/hooks/useAccountingTab';

interface AccountingRedirectProps {
    tab: AccountingTab;
}

/**
 * Maps a legacy standalone accounting path (e.g. `/accounting/ledger`) onto the
 * unified hub with the matching tab selected. Mirrors `AdminHrRedirect`.
 */
export function AccountingRedirect({ tab }: AccountingRedirectProps) {
    return (
        <Navigate to={`${FRONTEND_ROUTES.ACCOUNTING}?tab=${tab}`} replace />
    );
}
