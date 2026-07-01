import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePagination } from '../usePagination';

const rows = (n: number): number[] => Array.from({ length: n }, (_, i) => i + 1);

describe('usePagination', () => {
    it('slices the first page by the default size (10)', () => {
        const { result } = renderHook(() => usePagination(rows(25)));
        expect(result.current.pageRows).toEqual(rows(10));
        expect(result.current.total).toBe(25);
        expect(result.current.totalPages).toBe(3);
        expect(result.current.page).toBe(1);
    });

    it('honors a custom page size', () => {
        const { result } = renderHook(() => usePagination(rows(25), 5));
        expect(result.current.pageRows).toHaveLength(5);
        expect(result.current.totalPages).toBe(5);
    });

    it('returns the requested page slice', () => {
        const { result } = renderHook(() => usePagination(rows(25)));
        act(() => result.current.setPage(2));
        expect(result.current.page).toBe(2);
        expect(result.current.pageRows).toEqual([
            11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        ]);
    });

    it('clamps the page when the list shrinks below the current page', () => {
        const { result, rerender } = renderHook(
            ({ data }: { data: number[] }) => usePagination(data),
            { initialProps: { data: rows(25) } },
        );
        act(() => result.current.setPage(3));
        expect(result.current.page).toBe(3);
        rerender({ data: rows(8) }); // now a single page
        expect(result.current.page).toBe(1);
        expect(result.current.pageRows).toEqual(rows(8));
    });

    it('reports a single page (page 1) for an empty list', () => {
        const { result } = renderHook(() => usePagination<number>([]));
        expect(result.current.totalPages).toBe(1);
        expect(result.current.page).toBe(1);
        expect(result.current.pageRows).toEqual([]);
        expect(result.current.total).toBe(0);
    });
});
