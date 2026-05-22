import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'lp-theme';

function readStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: Theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());

    useEffect(() => {
        applyTheme(theme);
        window.localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
                setThemeState(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setTheme = useCallback((next: Theme) => setThemeState(next), []);
    const toggle = useCallback(
        () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
        [],
    );

    return { theme, setTheme, toggle };
}
