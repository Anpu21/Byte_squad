import { FRONTEND_ROUTES } from '@/constants/routes';
import type { SalesTab } from '@/features/sales';
import { createTabRedirect } from './createTabRedirect';

/**
 * Maps a legacy standalone sales path (e.g. `/transactions`, `/admin/schemes`)
 * onto the unified Sales hub with the matching tab selected.
 */
export const SalesRedirect = createTabRedirect<SalesTab>(
    FRONTEND_ROUTES.SALES,
    'transactions',
);
