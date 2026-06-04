import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { type PropsWithChildren, useEffect } from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAdminHrTab } from '../useAdminHrTab';

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
                    path="/admin/hr"
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

describe('useAdminHrTab', () => {
    it('defaults to "employees" when no tab param is present', () => {
        const Wrapper = makeRouteWrapper(['/admin/hr']);
        const { result } = renderHook(() => useAdminHrTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('employees');
    });

    it.each(['attendance', 'leaves', 'payroll'] as const)(
        'reads "%s" from the ?tab search param',
        (which) => {
            const Wrapper = makeRouteWrapper([`/admin/hr?tab=${which}`]);
            const { result } = renderHook(() => useAdminHrTab(), {
                wrapper: Wrapper,
            });
            expect(result.current.tab).toBe(which);
        },
    );

    it('falls back to "employees" for unknown tab values', () => {
        const Wrapper = makeRouteWrapper(['/admin/hr?tab=bogus']);
        const { result } = renderHook(() => useAdminHrTab(), {
            wrapper: Wrapper,
        });
        expect(result.current.tab).toBe('employees');
    });

    it('switching to payroll adds ?tab=payroll to the URL', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/admin/hr'], holder);
        const { result } = renderHook(() => useAdminHrTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('payroll'));
        expect(result.current.tab).toBe('payroll');
        expect(holder.search).toBe('?tab=payroll');
    });

    it('switching back to employees drops the tab param', () => {
        const holder: LocationHolder = { search: '' };
        const Wrapper = makeRouteWrapper(['/admin/hr?tab=leaves'], holder);
        const { result } = renderHook(() => useAdminHrTab(), {
            wrapper: Wrapper,
        });
        act(() => result.current.setTab('employees'));
        expect(result.current.tab).toBe('employees');
        expect(holder.search).toBe('');
    });
});
