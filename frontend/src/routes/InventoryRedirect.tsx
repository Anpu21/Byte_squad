import { FRONTEND_ROUTES } from '@/constants/routes';
import type { InventoryTab } from '@/features/admin-inventory/hooks/useInventoryTab';
import { createTabRedirect } from './createTabRedirect';

/**
 * Redirects a legacy inventory sub-page route into the unified workspace's
 * matching tab. The default `list` tab is kept out of the URL.
 */
export const InventoryRedirect = createTabRedirect<InventoryTab>(
    FRONTEND_ROUTES.INVENTORY,
    'list',
);
