import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const PURCHASES_TABS = ['suppliers'] as const;

export type PurchasesTab = (typeof PURCHASES_TABS)[number];

const DEFAULT_TAB: PurchasesTab = 'suppliers';

function isPurchasesTab(raw: string | null): raw is PurchasesTab {
    return (
        raw !== null && (PURCHASES_TABS as readonly string[]).includes(raw)
    );
}

/**
 * URL-backed tab state for the Purchases workspace (`?tab=`), mirroring
 * `useAdminHrTab`. The default tab keeps the URL clean.
 */
export function usePurchasesTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<PurchasesTab>(() => {
        const raw = searchParams.get('tab');
        return isPurchasesTab(raw) ? raw : DEFAULT_TAB;
    }, [searchParams]);

    const setTab = useCallback(
        (next: PurchasesTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === DEFAULT_TAB) {
                        params.delete('tab');
                    } else {
                        params.set('tab', next);
                    }
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    return { tab, setTab };
}
