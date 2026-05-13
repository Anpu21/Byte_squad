import type { IStockTransferRequest } from '@/types';
import { TransferHistoryRow } from './TransferHistoryRow';

interface TransferHistoryTableProps {
    items: IStockTransferRequest[];
    isLoading: boolean;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function TransferHistoryTable({
    items,
    isLoading,
    hasActiveFilters,
    onClearFilters,
    page,
    totalPages,
    onPageChange,
}: TransferHistoryTableProps) {
    return (
        <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Product
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Source → Destination
                            </th>
                            <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">
                                Qty
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Requester
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Closed at
                            </th>
                            <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">
                                Duration
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className="border-b border-border">
                                    {[...Array(7)].map((__, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <p className="text-sm font-medium text-text-2">
                                        No transfers in this range
                                    </p>
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={onClearFilters}
                                            className="mt-3 text-xs text-text-3 hover:text-text-1 transition-colors underline"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <TransferHistoryRow key={item.id} item={item} />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!isLoading && items.length > 0 && totalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-canvas/50">
                    <span>
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onPageChange(page - 1)}
                            disabled={page === 1}
                            className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            type="button"
                            onClick={() => onPageChange(page + 1)}
                            disabled={page === totalPages}
                            className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
