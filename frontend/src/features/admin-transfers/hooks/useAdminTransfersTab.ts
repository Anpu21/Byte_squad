import { useTabParam } from '@/hooks/useTabParam';

export type AdminTransfersTab = 'board' | 'history' | 'report';

const VALID_TABS: AdminTransfersTab[] = ['board', 'history', 'report'];

/**
 * Active tab for the admin stock-transfers workspace. Uses a namespaced
 * `transferTab` param so the board/history/report sub-tabs don't collide with
 * the Inventory workspace's own `?tab=` when embedded as a tab. Thin wrapper
 * over the shared {@link useTabParam}.
 */
export function useAdminTransfersTab() {
    return useTabParam<AdminTransfersTab>({
        valid: VALID_TABS,
        fallback: 'board',
        param: 'transferTab',
    });
}
