import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { type PropsWithChildren, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useTabParam } from '../useTabParam';

interface LocationHolder {
    search: string;
}

function makeRouteWrapper(initialEntries: string[], holder?: LocationHolder) {
    function LocationProbe() {
        const location = useLocation();
        useEffect(() => {
            if (holder) holder.search = location.search;
        });
        return null;
    }
    const Wrapper = ({ children }: PropsWithChildren) => (
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route
                    path="/x"
                    element={
                        <>
                            <LocationProbe />
                            {children}
                        </>
                    }
                />
            </Routes>
        </MemoryRouter>
    );
    return Wrapper;
}

const VALID = ['a', 'b', 'c'] as const;

describe('useTabParam', () => {
    it('defaults to the fallback when no param is present', () => {
        const Wrapper = makeRouteWrapper(['/x']);
        const { result } = renderHook(
            () => useTabParam({ valid: VALID, fallback: 'a' }),
            { wrapper: Wrapper },
        );
        expect(result.current.tab).toBe('a');
    });

    it.each(['b', 'c'] as const)('reads "%s" from the ?tab param', (which) => {
        const Wrapper = makeRouteWrapper([`/x?tab=${which}`]);
        const { result } = renderHook(
            () => useTabParam({ valid: VALID, fallback: 'a' }),
            { wrapper: Wrapper },
        );
        expect(result.current.tab).toBe(which);
    });

    it('clamps an out-of-range value to the fallback', () => {
        const Wrapper = makeRouteWrapper(['/x?tab=zzz']);
        const { result } = renderHook(
            () => useTabParam({ valid: VALID, fallback: 'a' }),
            { wrapper: Wrapper },
        );
        expect(result.current.tab).toBe('a');
    });

    it('switching to a non-fallback tab writes ?tab=', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/x'], holder);
        const { result } = renderHook(
            () => useTabParam({ valid: VALID, fallback: 'a' }),
            { wrapper: Wrapper },
        );
        act(() => result.current.setTab('b'));
        expect(result.current.tab).toBe('b');
        expect(holder.search).toBe('?tab=b');
    });

    it('switching back to the fallback drops the param', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/x?tab=b'], holder);
        const { result } = renderHook(
            () => useTabParam({ valid: VALID, fallback: 'a' }),
            { wrapper: Wrapper },
        );
        act(() => result.current.setTab('a'));
        expect(result.current.tab).toBe('a');
        expect(holder.search).toBe('');
    });

    it('honors a custom param name (e.g. transferTab)', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/x?transferTab=c'], holder);
        const { result } = renderHook(
            () =>
                useTabParam({
                    valid: VALID,
                    fallback: 'a',
                    param: 'transferTab',
                }),
            { wrapper: Wrapper },
        );
        expect(result.current.tab).toBe('c');
        act(() => result.current.setTab('b'));
        expect(holder.search).toBe('?transferTab=b');
    });
});
