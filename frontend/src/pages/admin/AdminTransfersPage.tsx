import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { TransferStatus } from '@/constants/enums';
import {
    stockTransfersService,
    type IStockTransferRequest,
} from '@/services/stock-transfers.service';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';

type StatusFilter = 'all' | TransferStatus;

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: TransferStatus.PENDING, label: 'Pending' },
    { key: TransferStatus.APPROVED, label: 'Approved' },
    { key: TransferStatus.IN_TRANSIT, label: 'In Transit' },
    { key: TransferStatus.COMPLETED, label: 'Completed' },
    { key: TransferStatus.REJECTED, label: 'Rejected' },
    { key: TransferStatus.CANCELLED, label: 'Cancelled' },
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

export default function AdminTransfersPage() {
    const navigate = useNavigate();

    const [filter, setFilter] = useState<StatusFilter>(
        TransferStatus.PENDING,
    );
    const [items, setItems] = useState<IStockTransferRequest[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const fetchTransfers = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await stockTransfersService.listAll({
                status: filter === 'all' ? undefined : filter,
                page,
                limit: 20,
            });
            setItems(result.items ?? []);
            setTotalPages(result.totalPages ?? 0);
        } catch {
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [filter, page]);

    useEffect(() => {
        fetchTransfers();
    }, [fetchTransfers]);

    const fetchCounts = useCallback(async () => {
        const statusList: TransferStatus[] = [
            TransferStatus.PENDING,
            TransferStatus.APPROVED,
            TransferStatus.IN_TRANSIT,
            TransferStatus.COMPLETED,
            TransferStatus.REJECTED,
            TransferStatus.CANCELLED,
        ];
        try {
            const entries = await Promise.all(
                statusList.map((s) =>
                    stockTransfersService
                        .listAll({ status: s, page: 1, limit: 1 })
                        .then((r) => [s, r.total] as const)
                        .catch(() => [s, 0] as const),
                ),
            );
            const map: Record<string, number> = {};
            let total = 0;
            for (const [s, count] of entries) {
                map[s] = count;
                total += count;
            }
            map.all = total;
            setCounts(map);
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts, items]);

    const changeFilter = (next: StatusFilter) => {
        setFilter(next);
        setPage(1);
    };

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Stock Transfers
                </h1>
                <p className="text-sm text-text-3 mt-1">
                    Review and approve inter-branch transfer requests.
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-1 mb-6 p-1 bg-surface-2 rounded-xl border border-border w-fit">
                {FILTER_TABS.map((t) => {
                    const isActive = filter === t.key;
                    const count = counts[t.key] ?? 0;
                    return (
                        <button
                            key={t.key}
                            onClick={() => changeFilter(t.key)}
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
                                        ? 'bg-slate-900/10 text-text-3'
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
                                    Destination
                                </th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">
                                    Source
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
                                    <tr
                                        key={i}
                                        className="border-b border-border"
                                    >
                                        {[...Array(7)].map((__, j) => (
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
                                        colSpan={7}
                                        className="px-6 py-16 text-center"
                                    >
                                        <p className="text-sm font-medium text-text-2">
                                            No transfers in this view
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const qty =
                                        item.approvedQuantity ??
                                        item.requestedQuantity;
                                    const isPending =
                                        item.status ===
                                        TransferStatus.PENDING;
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
                                            <td className="px-6 py-4 text-text-1">
                                                {item.destinationBranch.name}
                                            </td>
                                            <td className="px-6 py-4 text-text-2">
                                                {item.sourceBranch?.name ??
                                                    '—'}
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(
                                                            FRONTEND_ROUTES.TRANSFER_DETAIL.replace(
                                                                ':id',
                                                                item.id,
                                                            ),
                                                        );
                                                    }}
                                                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all ${
                                                        isPending
                                                            ? 'bg-primary text-text-inv hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                                                            : 'border border-border text-text-1 hover:bg-surface-2'
                                                    }`}
                                                >
                                                    {isPending
                                                        ? 'Review →'
                                                        : 'View'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
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
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
