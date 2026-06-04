import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type BranchHubTab = 'overview' | 'compare';

const TAB_PARAM = 'tab';
const VALID_TABS: BranchHubTab[] = ['overview', 'compare'];

function isBranchHubTab(value: string | null): value is BranchHubTab {
    return value !== null && (VALID_TABS as string[]).includes(value);
}

export function useBranchHubTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<BranchHubTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return isBranchHubTab(raw) ? raw : 'overview';
    }, [searchParams]);

    const setTab = useCallback(
        (next: BranchHubTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === 'overview') {
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
