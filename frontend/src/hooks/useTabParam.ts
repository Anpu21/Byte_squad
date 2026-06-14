import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

interface UseTabParamOptions<T extends string> {
    valid: readonly T[];
    fallback: T;
    param?: string;
}

/**
 * URL-synced tab state for tabbed workspaces. Reads the active tab from
 * `?<param>=` (default `tab`), clamped to `valid` — a missing or out-of-range
 * value resolves to `fallback`, so a role can never land on a tab it isn't
 * permitted to see. `setTab` writes the param (replacing history) and drops it
 * entirely when the value equals `fallback`, keeping canonical URLs clean.
 *
 * Generalizes the former per-hub hooks (useAccountingTab / useAdminHrTab /
 * useAdminTransfersTab); `param` supports namespaced cases like `transferTab`.
 */
export function useTabParam<T extends string>({
    valid,
    fallback,
    param = 'tab',
}: UseTabParamOptions<T>): { tab: T; setTab: (next: T) => void } {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<T>(() => {
        const raw = searchParams.get(param);
        return raw && (valid as readonly string[]).includes(raw)
            ? (raw as T)
            : fallback;
    }, [searchParams, valid, fallback, param]);

    const setTab = useCallback(
        (next: T) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === fallback) {
                        params.delete(param);
                    } else {
                        params.set(param, next);
                    }
                    return params;
                },
                { replace: true },
            );
        },
        [setSearchParams, fallback, param],
    );

    return { tab, setTab };
}
