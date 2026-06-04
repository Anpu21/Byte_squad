import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { type PropsWithChildren, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useInventoryTab } from '../useInventoryTab';

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
                    path="/inventory"
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

describe('useInventoryTab', () => {
    it('defaults to "list" when no tab param is present', () => {
        const Wrapper = makeRouteWrapper(['/inventory']);
        const { result } = renderHook(() => useInventoryTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('list');
    });

    it.each(['expiry', 'adjustments', 'returns', 'transfers'] as const)(
        'reads "%s" from the ?tab search param',
        (which) => {
            const Wrapper = makeRouteWrapper([`/inventory?tab=${which}`]);
            const { result } = renderHook(() => useInventoryTab(), {
                wrapper: Wrapper,
            });
            expect(result.current.tab).toBe(which);
        },
    );

    it('falls back to "list" for unknown tab values', () => {
        const Wrapper = makeRouteWrapper(['/inventory?tab=bogus']);
        const { result } = renderHook(() => useInventoryTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('list');
    });

    it('switching to expiry adds ?tab=expiry to the URL', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/inventory'], holder);
        const { result } = renderHook(() => useInventoryTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('expiry'));
        expect(result.current.tab).toBe('expiry');
        expect(holder.search).toBe('?tab=expiry');
    });

    it('switching back to list drops the tab param', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/inventory?tab=returns'], holder);
        const { result } = renderHook(() => useInventoryTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('list'));
        expect(result.current.tab).toBe('list');
        expect(holder.search).toBe('');
    });
});
