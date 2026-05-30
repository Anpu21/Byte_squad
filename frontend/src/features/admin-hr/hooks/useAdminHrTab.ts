import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export type AdminHrTab = 'employees' | 'attendance' | 'leaves' | 'payroll';

const TAB_PARAM = 'tab';
const VALID_TABS: AdminHrTab[] = [
    'employees',
    'attendance',
    'leaves',
    'payroll',
];

function isAdminHrTab(value: string | null): value is AdminHrTab {
    return value !== null && (VALID_TABS as string[]).includes(value);
}

export function useAdminHrTab() {
    const [searchParams, setSearchParams] = useSearchParams();

    const tab = useMemo<AdminHrTab>(() => {
        const raw = searchParams.get(TAB_PARAM);
        return isAdminHrTab(raw) ? raw : 'employees';
    }, [searchParams]);

    const setTab = useCallback(
        (next: AdminHrTab) => {
            setSearchParams(
                (prev) => {
                    const params = new URLSearchParams(prev);
                    if (next === 'employees') {
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
