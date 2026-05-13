import { TransferStatus } from '@/constants/enums';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import { formatTimeAgo } from '@/lib/format-time-ago';
import type { IStockTransferRequest } from '@/types';
import type { ScopeTab } from '../hooks/useTransferRequestsPage';

interface TransferRequestsTableProps {
    tab: ScopeTab;
    items: IStockTransferRequest[];
    isLoading: boolean;
    shippingId: string | null;
    onShip: (item: IStockTransferRequest) => void;
    onRowClick: (id: string) => void;
}

const COLUMN_COUNT = 6;

export function TransferRequestsTable({
    tab,
    items,
    isLoading,
    shippingId,
    onShip,
    onRowClick,
}: TransferRequestsTableProps) {
    const otherLabel = tab === 'my-requests' ? 'Source' : 'Destination';

    return (
        <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Product
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                {otherLabel}
                            </th>
                            <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">
                                Qty
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Status
                            </th>
                            <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                Requested
                            </th>
                            <th className="px-6 py-4 font-semibold text-right whitespace-nowrap"></th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className="border-b border-border">
                                    {[...Array(COLUMN_COUNT)].map((__, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : items.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={COLUMN_COUNT}
                                    className="px-6 py-16 text-center"
                                >
                                    <p className="text-sm font-medium text-text-2">
                                        {tab === 'my-requests'
                                            ? 'No transfer requests yet'
                                            : 'No incoming transfers'}
                                    </p>
                                    <p className="text-xs text-text-3 mt-1">
                                        {tab === 'my-requests'
                                            ? 'Create one when your branch needs stock from another branch.'
                                            : 'Approved transfers from other branches will appear here.'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => {
                                const otherBranch =
                                    tab === 'my-requests'
                                        ? (item.sourceBranch?.name ?? '—')
                                        : (item.destinationBranch?.name ?? '—');
                                const qty =
                                    item.approvedQuantity ??
                                    item.requestedQuantity;
                                const canShip =
                                    tab === 'incoming' &&
                                    item.status === TransferStatus.APPROVED;
                                return (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border hover:bg-surface-2 transition-colors group cursor-pointer"
                                        onClick={() => onRowClick(item.id)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="text-text-1 font-medium">
                                                {item.product.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-text-2">
                                            {otherBranch}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-text-1 font-medium">
                                            {qty}
                                        </td>
                                        <td className="px-6 py-4">
                                            <TransferStatusPill
                                                status={item.status}
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-text-3">
                                            {formatTimeAgo(item.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canShip && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onShip(item);
                                                    }}
                                                    disabled={
                                                        shippingId === item.id
                                                    }
                                                    className="h-8 px-3 rounded-lg bg-primary text-text-inv text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                                                >
                                                    {shippingId === item.id
                                                        ? 'Shipping…'
                                                        : 'Mark Shipped'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

