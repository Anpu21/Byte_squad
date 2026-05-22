import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LedgerPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number | ((p: number) => number)) => void;
}

function pickPageNumber(
    page: number,
    totalPages: number,
    i: number,
): number {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
}

export function LedgerPagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
}: LedgerPaginationProps) {
    if (totalPages <= 0 || total === 0) return null;

    const showFrom = total > 0 ? (page - 1) * limit + 1 : 0;
    const showTo = Math.min(page * limit, total);
    const visiblePages = Math.min(totalPages, 5);

    return (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-text-3">
            <span>
                Showing{' '}
                <span className="mono text-text-1">{showFrom}</span> to{' '}
                <span className="mono text-text-1">{showTo}</span> of{' '}
                <span className="mono text-text-1">{total}</span>
            </span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-md border border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Previous"
                >
                    <ChevronLeft size={14} />
                </button>
                {Array.from({ length: visiblePages }, (_, i) => {
                    const pageNum = pickPageNumber(page, totalPages, i);
                    return (
                        <button
                            key={pageNum}
                            type="button"
                            onClick={() => onPageChange(pageNum)}
                            className={`min-w-[32px] h-8 px-2 rounded-md border text-xs font-medium transition-colors ${
                                pageNum === page
                                    ? 'bg-primary text-text-inv border-primary'
                                    : 'border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}
                <button
                    type="button"
                    onClick={() =>
                        onPageChange((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-md border border-border-strong text-text-2 hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Next"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
