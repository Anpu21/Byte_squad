import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type AccountingTab =
    | 'ledger'
    | 'receivables'
    | 'reports'
    | 'expenses'
    | 'profit-loss';

const TAB_PARAM = 'tab';

/**
 * Reads the active accounting-hub tab from `?tab=`, clamped to the tabs the
 * current role is allowed to see. A missing or out-of-range param — including a
 * Manager hand-typing `?tab=ledger` — falls back to the first allowed tab, so a
 * role can never land on a tab it isn't permitted to view.
 */
export function useAccountingTab(allowed: AccountingTab[]) {
    const [searchParams, setSearchParams] = useSearchParams();
    const fallback = allowed[0];

    const tab = useMemo<AccountingTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return raw && (allowed as string[]).includes(raw)
            ? (raw as AccountingTab)
            : fallback;
    }, [searchParams, allowed, fallback]);

    const setTab = useCallback(
        (next: AccountingTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === fallback) {
                        params.delete(TAB_PARAM);
                    } else {
                        params.set(TAB_PARAM, next);
                    }
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams, fallback],
    );

    return { tab, setTab };
}
