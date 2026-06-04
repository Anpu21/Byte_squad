import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type InventoryTab =
    | 'list'
    | 'expiry'
    | 'adjustments'
    | 'returns'
    | 'transfers';

const TAB_PARAM = 'tab';
const VALID_TABS: InventoryTab[] = [
    'list',
    'expiry',
    'adjustments',
    'returns',
    'transfers',
];

function isInventoryTab(value: string | null): value is InventoryTab {
    return value !== null && (VALID_TABS as string[]).includes(value);
}

/**
 * Active tab for the unified Inventory workspace, tracked in the `?tab=` URL
 * search param (mirrors `useAdminHrTab`). The default tab (`list`) is kept out
 * of the URL, and switching uses `{ replace: true }` so tab changes don't
 * pollute browser history.
 */
export function useInventoryTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<InventoryTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return isInventoryTab(raw) ? raw : 'list';
    }, [searchParams]);

    const setTab = useCallback(
        (next: InventoryTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === 'list') {
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
