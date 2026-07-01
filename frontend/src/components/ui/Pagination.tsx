import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { buildPageWindow, MAX_VISIBLE_PAGES } from './pagination-window';

interface PaginationProps {
    /** 1-based current page. */
    page: number;
    /** Rows per page. */
    pageSize: number;
    /** Total rows across all pages. */
    total: number;
    onPageChange: (page: number) => void;
    /** Plural noun for the range label, e.g. "transactions". */
    unit?: string;
    className?: string;
}

/**
 * Canonical table pager — "Showing x–y of N {unit}" range + a windowed strip of
 * numbered pages + prev/next. Page-based: feed it straight from a server hook
 * (`{page, total}`) or from the client-side `usePagination` hook. Render it via
 * `DataTable`'s `footer` slot, or directly under a bespoke `<table>`.
 *
 * The range label always shows (so truncation stays visible); the page controls
 * appear only when there is more than one page.
 */
export default function Pagination({
    page,
    pageSize,
    total,
    onPageChange,
    unit = 'items',
    className,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(page, 1), totalPages);
    const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
    const end = Math.min(total, current * pageSize);

    return (
        <div
            className={cn(
                'flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border',
                className,
            )}
        >
            <p className="text-[13px] text-text-3">
                {total === 0 ? (
                    `No ${unit}`
                ) : (
                    <>
                        Showing{' '}
                        <strong className="text-text-2 font-semibold tabular-nums">
                            {start}–{end}
                        </strong>{' '}
                        of{' '}
                        <strong className="text-text-2 font-semibold tabular-nums">
                            {total}
                        </strong>{' '}
                        {unit}
                    </>
                )}
            </p>
            {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                    <PagerButton
                        onClick={() => onPageChange(current - 1)}
                        disabled={current <= 1}
                        aria-label="Previous page"
                    >
                        <Chevron dir="left" />
                    </PagerButton>
                    {buildPageWindow(current, totalPages, MAX_VISIBLE_PAGES).map(
                        (n) => (
                            <PagerButton
                                key={n}
                                onClick={() => onPageChange(n)}
                                active={n === current}
                                aria-label={`Page ${n}`}
                                aria-current={n === current ? 'page' : undefined}
                            >
                                <span className="tabular-nums">{n}</span>
                            </PagerButton>
                        ),
                    )}
                    <PagerButton
                        onClick={() => onPageChange(current + 1)}
                        disabled={current >= totalPages}
                        aria-label="Next page"
                    >
                        <Chevron dir="right" />
                    </PagerButton>
                </div>
            )}
        </div>
    );
}

interface PagerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    children: ReactNode;
}

function PagerButton({ active, className, children, ...props }: PagerButtonProps) {
    return (
        <button
            type="button"
            className={cn(
                'h-[34px] min-w-[34px] px-2 inline-flex items-center justify-center rounded-md border text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25 disabled:opacity-40 disabled:cursor-not-allowed',
                active
                    ? 'border-primary bg-primary text-text-inv'
                    : 'border-border-strong bg-surface text-text-3 hover:bg-surface-hover hover:text-text-1',
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
        </svg>
    );
}
