import { LuX as X } from 'react-icons/lu';
import { usePosRecentSales } from '@/features/pos/hooks/usePosRecentSales';
import { formatCurrency } from '@/lib/utils';
import { formatTimeAgo } from '@/lib/format-time-ago';
import type { IRecentSaleRow } from '@/types';

interface IPosRecentSaleSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSale: (saleId: string) => void;
}

interface IStatusVisual {
    label: string;
    className: string;
    strike: boolean;
}

/**
 * Map the Sale row to the visual treatment for its payment badge. Voided
 * sales win over payment-status; otherwise we colour by paymentStatus so
 * the cashier can tell paid / partially-paid / unpaid at a glance.
 */
function resolveStatusVisual(row: IRecentSaleRow): IStatusVisual {
    if (row.status === 'Voided') {
        return { label: 'Voided', className: 'bg-surface-2 text-text-3', strike: true };
    }
    if (row.paymentStatus === 'Paid') {
        return { label: 'Paid', className: 'bg-primary-soft text-primary-soft-text', strike: false };
    }
    if (row.paymentStatus === 'Partially_Paid') {
        return { label: 'Partial', className: 'bg-warning-soft text-warning', strike: false };
    }
    return { label: 'Unpaid', className: 'bg-danger-soft text-danger', strike: false };
}

/**
 * Right-edge sidebar listing the most recent 10 sales for the current
 * cashier session. Toggled by F10 from the action bar; clicking a row
 * fires `onSelectSale(saleId)` so the parent can decide what to do next
 * (Phase 13 will mount a re-print drawer here).
 *
 * Renders loading / empty / populated states. Each row shows invoice
 * number, customer name (or Walk-in), the total, and a payment-status
 * badge tinted via Tailwind tokens.
 */
export function PosRecentSaleSidebar({
    isOpen,
    onClose,
    onSelectSale,
}: IPosRecentSaleSidebarProps) {
    const { data, isLoading } = usePosRecentSales(10);

    if (!isOpen) return null;

    return (
        <aside
            role="complementary"
            aria-label="Recent sales"
            className="fixed top-0 right-0 z-40 h-full w-full sm:w-[360px] bg-surface border-l border-border-strong shadow-lg-token flex flex-col"
        >
            <header className="flex items-center justify-between px-4 h-12 border-b border-border-strong shrink-0">
                <h3 className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-2">
                    Recent sales
                </h3>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close recent sales"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-3 hover:bg-surface-2 hover:text-text-1 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                >
                    <X size={16} aria-hidden />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <RecentSidebarSkeleton />
                ) : !data || data.length === 0 ? (
                    <p className="px-4 py-8 text-center text-[13px] text-text-3">
                        No recent sales yet.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {data.map((row) => (
                            <RecentSaleRow
                                key={row.id}
                                row={row}
                                onClick={() => onSelectSale(row.id)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </aside>
    );
}

function RecentSidebarSkeleton() {
    return (
        <div className="flex flex-col" role="status" aria-label="Loading recent sales">
            {Array.from({ length: 4 }).map((_, idx) => (
                <div
                    key={idx}
                    className="px-4 py-3 border-b border-border animate-pulse"
                >
                    <div className="h-3.5 w-24 rounded bg-surface-2 mb-2" />
                    <div className="h-3 w-32 rounded bg-surface-2" />
                </div>
            ))}
        </div>
    );
}

interface IRecentSaleRowProps {
    row: IRecentSaleRow;
    onClick: () => void;
}

function RecentSaleRow({ row, onClick }: IRecentSaleRowProps) {
    const visual = resolveStatusVisual(row);
    const customerLabel = row.customerName ?? 'Walk-in';
    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                className="w-full px-4 py-3 flex items-start justify-between gap-3 text-left transition-colors hover:bg-surface-2 focus:outline-none focus:bg-surface-2"
            >
                <div className="min-w-0 flex-1">
                    <div
                        className={
                            visual.strike
                                ? 'text-[13px] font-semibold text-text-1 tabular-nums line-through'
                                : 'text-[13px] font-semibold text-text-1 tabular-nums'
                        }
                    >
                        {row.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-text-3 truncate mt-0.5">
                        {customerLabel} · {formatTimeAgo(row.createdAt)}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[13px] font-semibold text-primary tabular-nums">
                        {formatCurrency(row.total)}
                    </span>
                    <span
                        className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${visual.className}`}
                    >
                        {visual.label}
                    </span>
                </div>
            </button>
        </li>
    );
}
