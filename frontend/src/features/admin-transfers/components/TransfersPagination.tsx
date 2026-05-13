interface TransfersPaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

export function TransfersPagination({
    page,
    totalPages,
    onChange,
}: TransfersPaginationProps) {
    const baseClass =
        'px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-canvas/50">
            <span>
                Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(page - 1)}
                    disabled={page === 1}
                    className={baseClass}
                >
                    Previous
                </button>
                <button
                    onClick={() => onChange(page + 1)}
                    disabled={page === totalPages}
                    className={baseClass}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
