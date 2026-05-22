import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InventoryPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
}

function getPageNumbers(page: number, totalPages: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }
    pages.push(1);
    if (page > 3) pages.push('...');
    for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
    ) {
        pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
}

export function InventoryPagination({
    page,
    totalPages,
    total,
    limit,
    onPageChange,
}: InventoryPaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="mt-4 px-1 flex items-center justify-between text-xs text-text-3">
            <span>
                Showing {startItem} – {endItem} of {total}
            </span>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 rounded-md border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={14} />
                </button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-2">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={`min-w-[28px] h-7 px-2 rounded-md text-xs transition-colors ${
                                p === page
                                    ? 'bg-accent-soft text-accent-text font-semibold'
                                    : 'border border-border hover:bg-surface-2 hover:text-text-1'
                            }`}
                        >
                            {p}
                        </button>
                    ),
                )}
                <button
                    type="button"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-md border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Next page"
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
