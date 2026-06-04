import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type AdminTransfersTab = 'board' | 'history';

const TAB_PARAM = 'tab';
const VALID_TABS: AdminTransfersTab[] = ['board', 'history'];

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
