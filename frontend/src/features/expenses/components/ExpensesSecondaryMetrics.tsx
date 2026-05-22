import { formatCurrencyWhole } from '../lib/format';

interface ExpensesSecondaryMetricsProps {
    total: number;
    pendingCount: number;
    approvedCount: number;
    largestCategory: { name: string; amount: number } | null;
}

export function ExpensesSecondaryMetrics({
    total,
    pendingCount,
    approvedCount,
    largestCategory,
}: ExpensesSecondaryMetricsProps) {
    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-2 mb-5 px-1">
            <span>
                <span className="text-text-1 font-medium mono">{total}</span>{' '}
                entries
            </span>
            <span className="text-text-3">·</span>
            <span className="text-warning">
                <span className="font-medium mono">{pendingCount}</span> pending
            </span>
            <span className="text-text-3">·</span>
            <span className="text-accent-text">
                <span className="font-medium mono">{approvedCount}</span>{' '}
                approved
            </span>
            {largestCategory && (
                <>
                    <span className="text-text-3">·</span>
                    <span>
                        Top:{' '}
                        <span className="text-text-1 font-medium">
                            {largestCategory.name}
                        </span>{' '}
                        <span className="text-text-1 font-medium mono">
                            {formatCurrencyWhole(largestCategory.amount)}
                        </span>
                    </span>
                </>
            )}
        </div>
    );
}
