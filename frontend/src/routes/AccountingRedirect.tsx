import { FRONTEND_ROUTES } from '@/constants/routes';
import type { AccountingTab } from '@/features/accounting/hooks/useAccountingTab';
import { createTabRedirect } from './createTabRedirect';

/**
 * Maps a legacy standalone accounting path (e.g. `/accounting/ledger`) onto the
 * unified hub with the matching tab selected.
 */
export const AccountingRedirect = createTabRedirect<AccountingTab>(
    FRONTEND_ROUTES.ACCOUNTING,
    'ledger',
);
