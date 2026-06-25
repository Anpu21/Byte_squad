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
 * Range label + prev/next controls for offset-based pagination — the shared
 * replacement for the per-feature pager markup. Hides nothing: shows the
 * "x–y of N" range so truncation is always visible.
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
                'flex items-center justify-between gap-3 px-5 py-3 border-t border-border bg-surface-2/30',
                className,
            )}
        >
            <p className="text-[11px] text-text-3 tabular-nums">
                {total === 0 ? `No ${unit}` : `${start}–${end} of ${total}`}
            </p>
            <div className="flex items-center gap-2">
                <PagerButton onClick={onPrev} disabled={!canPrev}>
                    Previous
                </PagerButton>
                <PagerButton onClick={onNext} disabled={!canNext}>
                    Next
                </PagerButton>
            </div>
        </div>
    );
}

function PagerButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type="button"
            className={cn(
                'h-8 px-3 rounded-md border border-border text-[12px] font-semibold text-text-1 transition-colors hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30',
                className,
            )}
            {...props}
        />
    );
}
