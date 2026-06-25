import { FRONTEND_ROUTES } from '@/constants/routes';
import type { AdminHrTab } from '@/features/admin-hr';
import { createTabRedirect } from './createTabRedirect';

/**
 * Maps a legacy standalone HR path onto the unified HR hub with the matching
 * tab selected. The default `employees` tab is kept out of the URL.
 */
export const AdminHrRedirect = createTabRedirect<AdminHrTab>(
    FRONTEND_ROUTES.ADMIN_HR,
    'employees',
);
