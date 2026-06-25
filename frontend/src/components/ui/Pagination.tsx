import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    /** Zero-based offset of the first row on the current page. */
    offset: number;
    /** Number of rows on the current page. */
    pageCount: number;
    /** Total rows across all pages. */
    total: number;
    /** Page size. */
    limit: number;
    onPrev: () => void;
    onNext: () => void;
    /** Plural noun for the range label, e.g. "employees". */
    unit?: string;
    className?: string;
}

/**
 * Ledger UI Kit pager — "Showing x–y of N" range + icon prev/next controls.
 * Offset-based; always shows the range so truncation is visible.
 */
export default function Pagination({
    offset,
    pageCount,
    total,
    limit,
    onPrev,
    onNext,
    unit = 'items',
    className,
}: PaginationProps) {
    const start = total === 0 ? 0 : offset + 1;
    const end = Math.min(total, offset + pageCount);
    const canPrev = offset > 0;
    const canNext = offset + limit < total;

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
            <div className="flex items-center gap-1.5">
                <PagerButton
                    onClick={onPrev}
                    disabled={!canPrev}
                    aria-label="Previous page"
                >
                    <Chevron dir="left" />
                </PagerButton>
                <PagerButton
                    onClick={onNext}
                    disabled={!canNext}
                    aria-label="Next page"
                >
                    <Chevron dir="right" />
                </PagerButton>
            </div>
        </div>
    );
}

function PagerButton({
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                'h-[34px] w-[34px] inline-flex items-center justify-center rounded-md border border-border-strong bg-surface text-text-3 transition-colors hover:bg-surface-hover hover:text-text-1 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-focus/25',
                className,
            )}
            {...props}
        />
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
