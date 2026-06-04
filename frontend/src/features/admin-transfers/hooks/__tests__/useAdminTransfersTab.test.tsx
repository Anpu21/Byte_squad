import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { type PropsWithChildren, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAdminTransfersTab } from '../useAdminTransfersTab';

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
                    path="/admin/transfers"
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

describe('useAdminTransfersTab', () => {
    it('defaults to "board" when no tab param is present', () => {
        const Wrapper = makeRouteWrapper(['/admin/transfers']);
        const { result } = renderHook(() => useAdminTransfersTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('board');
    });

    it('reads "history" from the ?transferTab=history search param', () => {
        const Wrapper = makeRouteWrapper(['/admin/transfers?transferTab=history']);
        const { result } = renderHook(() => useAdminTransfersTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('history');
    });

    it('falls back to "board" for unknown tab values', () => {
        const Wrapper = makeRouteWrapper(['/admin/transfers?transferTab=bogus']);
        const { result } = renderHook(() => useAdminTransfersTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('board');
    });

    it('switching to history adds ?transferTab=history to the URL', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/admin/transfers'], holder);
        const { result } = renderHook(() => useAdminTransfersTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('history'));
        expect(result.current.tab).toBe('history');
        expect(holder.search).toBe('?transferTab=history');
    });

    it('switching back to board drops the tab param', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(
            ['/admin/transfers?transferTab=history'],
            holder,
        );
        const { result } = renderHook(() => useAdminTransfersTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('board'));
        expect(result.current.tab).toBe('board');
        expect(holder.search).toBe('');
    });
});
