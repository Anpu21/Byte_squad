import { useTabParam } from '@/hooks/useTabParam';

export type InventoryTab =
    | 'list'
    | 'expiry'
    | 'adjustments'
    | 'returns'
    | 'transfers'
    | 'categories'
    | 'labels';

const VALID_TABS: InventoryTab[] = [
    'list',
    'expiry',
    'adjustments',
    'returns',
    'transfers',
    'categories',
    'labels',
];

/**
 * Active tab for the unified Inventory workspace, tracked in `?tab=`. The
 * default tab (`list`) is kept out of the URL. Thin wrapper over the shared
 * {@link useTabParam}.
 */
export function useInventoryTab() {
    return useTabParam<InventoryTab>({ valid: VALID_TABS, fallback: 'list' });
}
