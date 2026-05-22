interface TransferHistoryHeaderProps {
    isAdmin: boolean;
    total: number;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export function TransferHistoryHeader({
    isAdmin,
    total,
    hasActiveFilters,
    onClearFilters,
}: TransferHistoryHeaderProps) {
    return (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Transfer History
                    </h1>
                    <span className="text-[11px] min-w-[22px] h-[22px] px-2 flex items-center justify-center rounded-full bg-surface-2 text-text-2 font-medium">
                        {total}
                    </span>
                </div>
                <p className="text-sm text-text-3 mt-1">
                    {isAdmin
                        ? 'Audit trail of all completed, rejected, and cancelled transfers across every branch.'
                        : 'Past transfers your branch has been involved in — completed, rejected, or cancelled.'}
                </p>
            </div>
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={onClearFilters}
                    className="h-9 px-4 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors self-start"
                >
                    Clear filters
                </button>
            )}
        </div>
    );
}
