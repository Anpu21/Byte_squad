import { ArrowRight } from 'lucide-react';
import { TransferStatus } from '@/constants/enums';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';
import Button from '@/components/ui/Button';
import { formatTimeAgo } from '@/lib/format-time-ago';
import type { IStockTransferRequest } from '@/types';
import type { ScopeTab } from '../hooks/useTransferRequestsPage';

type ListScopeTab = Exclude<ScopeTab, 'history'>;

interface TransferRequestsTableProps {
    tab: ListScopeTab;
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
    if (!isLoading && items.length === 0) {
        return (
            <div className="bg-surface border border-border rounded-xl py-16 text-center">
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
            </div>
        );
    }

    return (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-3 bg-surface-2">
                            <th className="px-5 py-3 font-semibold">Product</th>
                            <th className="px-5 py-3 font-semibold">Route</th>
                            <th className="px-5 py-3 font-semibold text-right">
                                Qty
                            </th>
                            <th className="px-5 py-3 font-semibold">Status</th>
                            <th className="px-5 py-3 font-semibold text-right">
                                Requested
                            </th>
                            <th className="px-5 py-3 font-semibold text-right" />
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => (
                                <tr key={i} className="border-b border-border">
                                    {[...Array(COLUMN_COUNT)].map((__, j) => (
                                        <td key={j} className="px-5 py-3.5">
                                            <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            items.map((item) => {
                                const qty =
                                    item.approvedQuantity ??
                                    item.requestedQuantity;
                                const canShip =
                                    tab === 'incoming' &&
                                    item.status === TransferStatus.APPROVED;
                                return (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors cursor-pointer"
                                        onClick={() => onRowClick(item.id)}
                                    >
                                        <td className="px-5 py-3.5 text-text-1 font-medium">
                                            {item.product.name}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center gap-1.5 text-xs text-text-2">
                                                {item.sourceBranch?.name ?? (
                                                    <span className="text-text-3 italic">
                                                        No source
                                                    </span>
                                                )}
                                                <ArrowRight
                                                    size={13}
                                                    className="text-text-3 flex-shrink-0"
                                                />
                                                <span className="text-text-1 font-medium">
                                                    {item.destinationBranch
                                                        ?.name ?? '—'}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right tabular-nums text-text-1 font-medium">
                                            {qty}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <TransferStatusPill
                                                status={item.status}
                                            />
                                        </td>
                                        <td className="px-5 py-3.5 text-right text-text-3 whitespace-nowrap">
                                            {formatTimeAgo(item.createdAt)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            {canShip && (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onShip(item);
                                                    }}
                                                    disabled={
                                                        shippingId === item.id
                                                    }
                                                >
                                                    {shippingId === item.id
                                                        ? 'Shipping…'
                                                        : 'Mark shipped'}
                                                </Button>
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
