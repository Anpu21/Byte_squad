import { useMemo, useState } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';

export interface UsePaginationResult<T> {
    /** 1-based current page, always clamped into `[1, totalPages]`. */
    page: number;
    setPage: (page: number) => void;
    /** Rows belonging to the current page. */
    pageRows: T[];
    /** Total rows across all pages. */
    total: number;
    totalPages: number;
    pageSize: number;
}

/**
 * Client-side pagination for tables that already hold every row in memory.
 * Slices `rows` into pages of `pageSize` and keeps the visible page valid as the
 * list shrinks (e.g. after a filter/search) — no blank out-of-range pages. The
 * returned `page` is the clamped value, so `<Pagination/>` and the slice always
 * agree.
 *
 * For lists backed by a paginatable API, drive the request with `page`/`limit`
 * instead and feed `<Pagination/>` the server's `{page, total}` — this hook is
 * the in-memory counterpart, not a replacement for server paging.
 */
export function usePagination<T>(
    rows: T[],
    pageSize: number = DEFAULT_PAGE_SIZE,
): UsePaginationResult<T> {
    const [page, setPage] = useState(1);

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(page, 1), totalPages);

    const pageRows = useMemo(
        () => rows.slice((current - 1) * pageSize, current * pageSize),
        [rows, current, pageSize],
    );

    return { page: current, setPage, pageRows, total, totalPages, pageSize };
}
