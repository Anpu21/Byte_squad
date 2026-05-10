import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { TransferStatus } from '@/constants/enums';
import { useStockTransfers } from '@/hooks/useStockTransfers';
import {
    stockTransfersService,
    type IStockTransferRequest,
} from '@/services/stock-transfers.service';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';

type ScopeTab = 'my-requests' | 'incoming';

const TABS: { key: ScopeTab; label: string }[] = [
    { key: 'my-requests', label: 'My Requests' },
    { key: 'incoming', label: 'Incoming' },
];

function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function TransferRequestsPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<ScopeTab>('my-requests');
    const [shippingId, setShippingId] = useState<string | null>(null);

    const myRequests = useStockTransfers({ scope: 'my-requests' });
    const incoming = useStockTransfers({ scope: 'incoming' });

    const active = tab === 'my-requests' ? myRequests : incoming;

    const handleShip = async (transfer: IStockTransferRequest) => {
        setShippingId(transfer.id);
        try {
            await stockTransfersService.ship(transfer.id);
            toast.success('Transfer marked as shipped');
            incoming.refetch();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to ship transfer';
            toast.error(message);
        } finally {
            setShippingId(null);
        }
    };

    const items = active.items;

    return (
        <div className="animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Stock Transfers
                    </h1>
                    <p className="text-sm text-text-3 mt-1">
                        Request inventory from other branches and fulfill
                        approved incoming transfers.
                    </p>
                </div>
                <button
                    onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS_NEW)}
                    className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all flex items-center gap-2 self-start"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    New Request
                </button>
            </div>

            <div className="flex items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit">
                {TABS.map((t) => {
                    const isActive = tab === t.key;
                    const count =
                        t.key === 'my-requests'
                            ? myRequests.total
                            : incoming.total;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                isActive
                                    ? 'bg-primary text-text-inv shadow-sm'
                                    : 'text-text-2 hover:text-text-1 hover:bg-surface-2'
                            }`}
                        >
                            {t.label}
                            <span
                                className={`text-[11px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full ${
                                    isActive
                                        ? 'bg-surface-2 text-text-3'
                                        : 'bg-surface-2 text-text-3'
                                }`}
                            >
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                    Product
                                </th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                    {tab === 'my-requests' ? 'Source' : 'Destination'}
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
                            {active.isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-border"
                                    >
                                        {[...Array(6)].map((__, j) => (
                                            <td
                                                key={j}
                                                className="px-6 py-4"
                                            >
                                                <div className="h-5 w-24 bg-surface-2 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
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
                                            ? item.sourceBranch?.name ?? '—'
                                            : item.destinationBranch?.name ??
                                              '—';
                                    const qty =
                                        item.approvedQuantity ??
                                        item.requestedQuantity;
                                    const canShip =
                                        tab === 'incoming' &&
                                        item.status ===
                                            TransferStatus.APPROVED;
                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-border hover:bg-surface-2 transition-colors group cursor-pointer"
                                            onClick={() =>
                                                navigate(
                                                    FRONTEND_ROUTES.TRANSFER_DETAIL.replace(
                                                        ':id',
                                                        item.id,
                                                    ),
                                                )
                                            }
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
                                                {formatTimeAgo(
                                                    item.createdAt,
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {canShip && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleShip(item);
                                                        }}
                                                        disabled={
                                                            shippingId ===
                                                            item.id
                                                        }
                                                        className="h-8 px-3 rounded-lg bg-primary text-text-inv text-xs font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                                                    >
                                                        {shippingId ===
                                                        item.id
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
        </div>
    );
}
