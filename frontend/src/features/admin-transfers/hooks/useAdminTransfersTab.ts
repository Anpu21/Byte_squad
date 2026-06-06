import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type AdminTransfersTab = 'board' | 'history' | 'report';

// Namespaced param so the admin board/history sub-tabs don't collide with the
// Inventory workspace's own `?tab=` when this page is embedded as a tab.
const TAB_PARAM = 'transferTab';
const VALID_TABS: AdminTransfersTab[] = ['board', 'history', 'report'];

function isAdminTransfersTab(value: string | null): value is AdminTransfersTab {
    return value !== null && (VALID_TABS as string[]).includes(value);
}

export function useAdminTransfersTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<AdminTransfersTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return isAdminTransfersTab(raw) ? raw : 'board';
    }, [searchParams]);

    const setTab = useCallback(
        (next: AdminTransfersTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === 'board') {
                        params.delete(TAB_PARAM);
                    } else {
                        params.set(TAB_PARAM, next);
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
