import { Navigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { InventoryTab } from '@/features/admin-inventory/hooks/useInventoryTab';

/**
 * Redirects a legacy inventory sub-page route into the unified workspace's
 * matching tab (mirrors `AdminHrRedirect`). The default `list` tab is kept out
 * of the URL.
 */
export function InventoryRedirect({ tab }: { tab: InventoryTab }) {
    const search = tab === 'list' ? '' : `?tab=${tab}`;
    return <Navigate to={`${FRONTEND_ROUTES.INVENTORY}${search}`} replace />;
}
