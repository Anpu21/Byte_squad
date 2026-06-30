import { useTabParam } from '@/hooks/useTabParam';

export const PURCHASES_TABS = [
    'grns',
    'new-grn',
    'orders',
    'reorder',
    'bills',
    'ageing',
    'suppliers',
] as const;

export type PurchasesTab = (typeof PURCHASES_TABS)[number];

/**
 * URL-backed tab state for the Purchases workspace (`?tab=`). The default tab
 * (`grns`) keeps the URL clean. Thin wrapper over the shared {@link useTabParam}.
 */
export function usePurchasesTab() {
    return useTabParam<PurchasesTab>({
        valid: PURCHASES_TABS,
        fallback: 'grns',
    });
}
