import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { TransferStatus, UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { useTransferHistory } from '@/hooks/useStockTransfers';
import { inventoryService, type IProduct } from '@/services/inventory.service';
import { adminService } from '@/services/admin.service';
import type { IBranchWithMeta } from '@/types';
import type { IStockTransferRequest } from '@/services/stock-transfers.service';
import TransferStatusPill from '@/components/transfers/TransferStatusPill';

const HISTORY_STATUSES: { key: TransferStatus; label: string }[] = [
    { key: TransferStatus.COMPLETED, label: 'Completed' },
    { key: TransferStatus.REJECTED, label: 'Rejected' },
    { key: TransferStatus.CANCELLED, label: 'Cancelled' },
];

function terminalAt(transfer: IStockTransferRequest): string | null {
    if (transfer.status === TransferStatus.COMPLETED) {
        return transfer.receivedAt;
    }
    return transfer.reviewedAt;
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

function formatDuration(fromIso: string, toIso: string | null): string {
    if (!toIso) return '—';
    const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
    if (ms < 0) return '—';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        const remMin = minutes % 60;
        return remMin > 0 ? `${hours}h ${remMin}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

export default function TransferHistoryPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const [selectedStatuses, setSelectedStatuses] = useState<TransferStatus[]>([
        TransferStatus.COMPLETED,
        TransferStatus.REJECTED,
        TransferStatus.CANCELLED,
    ]);
    const [from, setFrom] = useState<string>('');
    const [to, setTo] = useState<string>('');
    const [productId, setProductId] = useState<string>('');
    const [productSearch, setProductSearch] = useState<string>('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [branchId, setBranchId] = useState<string>('');
    const [branches, setBranches] = useState<IBranchWithMeta[]>([]);
    const [products, setProducts] = useState<IProduct[]>([]);

    const {
        items,
        total,
        totalPages,
        page,
        setPage,
        updateFilters,
        isLoading,
    } = useTransferHistory();

    // Load reference data once.
    useEffect(() => {
        inventoryService
            .getProducts()
            .then(setProducts)
            .catch(() => setProducts([]));
        if (isAdmin) {
            adminService
                .listBranches()
                .then(setBranches)
                .catch(() => setBranches([]));
        }
    }, [isAdmin]);

    // Push the controlled filter state to the hook whenever it changes.
    useEffect(() => {
        updateFilters({
            status:
                selectedStatuses.length === HISTORY_STATUSES.length
                    ? undefined
                    : selectedStatuses,
            from: from || undefined,
            to: to || undefined,
            productId: productId || undefined,
            branchId: isAdmin && branchId ? branchId : undefined,
        });
    }, [selectedStatuses, from, to, productId, branchId, isAdmin, updateFilters]);

    // Derived product list for the typeahead dropdown.
    const productResults = useMemo(() => {
        const q = productSearch.trim().toLowerCase();
        if (!q) return [];
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.toLowerCase().includes(q),
            )
            .slice(0, 8);
    }, [productSearch, products]);

    const selectedProduct = useMemo(
        () => products.find((p) => p.id === productId) ?? null,
        [products, productId],
    );

    const toggleStatus = (status: TransferStatus) => {
        setSelectedStatuses((prev) => {
            if (prev.includes(status)) {
                // Don't allow deselecting all — fall back to default set.
                if (prev.length === 1) return prev;
                return prev.filter((s) => s !== status);
            }
            return [...prev, status];
        });
    };

    const clearFilters = () => {
        setSelectedStatuses([
            TransferStatus.COMPLETED,
            TransferStatus.REJECTED,
            TransferStatus.CANCELLED,
        ]);
        setFrom('');
        setTo('');
        setProductId('');
        setProductSearch('');
        setBranchId('');
    };

    const hasActiveFilters =
        from !== '' ||
        to !== '' ||
        productId !== '' ||
        branchId !== '' ||
        selectedStatuses.length !== HISTORY_STATUSES.length;

    return (
        <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white tracking-tight">
                            Transfer History
                        </h1>
                        <span className="text-[11px] min-w-[22px] h-[22px] px-2 flex items-center justify-center rounded-full bg-white/5 text-slate-400 font-medium">
                            {total}
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {isAdmin
                            ? 'Audit trail of all completed, rejected, and cancelled transfers across every branch.'
                            : 'Past transfers your branch has been involved in — completed, rejected, or cancelled.'}
                    </p>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="h-9 px-4 rounded-lg border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors self-start"
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* Filter bar */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
                {/* Status pills */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mr-1">
                        Status
                    </span>
                    {HISTORY_STATUSES.map((s) => {
                        const isSelected = selectedStatuses.includes(s.key);
                        return (
                            <button
                                key={s.key}
                                onClick={() => toggleStatus(s.key)}
                                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                    isSelected
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {s.label}
                            </button>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Date from */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            From
                        </label>
                        <input
                            type="date"
                            value={from}
                            max={to || undefined}
                            onChange={(e) => setFrom(e.target.value)}
                            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all [color-scheme:dark]"
                        />
                    </div>
                    {/* Date to */}
                    <div>
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            To
                        </label>
                        <input
                            type="date"
                            value={to}
                            min={from || undefined}
                            onChange={(e) => setTo(e.target.value)}
                            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all [color-scheme:dark]"
                        />
                    </div>

                    {/* Product typeahead */}
                    <div className="relative">
                        <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            Product
                        </label>
                        {selectedProduct ? (
                            <div className="flex items-center gap-2 h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg">
                                <span className="text-sm text-slate-200 truncate flex-1">
                                    {selectedProduct.name}
                                </span>
                                <button
                                    onClick={() => {
                                        setProductId('');
                                        setProductSearch('');
                                    }}
                                    className="text-slate-500 hover:text-white text-lg leading-none"
                                    aria-label="Clear product filter"
                                >
                                    ×
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setShowProductDropdown(true);
                                    }}
                                    onFocus={() => setShowProductDropdown(true)}
                                    onBlur={() => {
                                        // Delay so click on dropdown can land first.
                                        setTimeout(
                                            () => setShowProductDropdown(false),
                                            150,
                                        );
                                    }}
                                    placeholder="Search product or barcode…"
                                    className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                                />
                                {showProductDropdown &&
                                    productResults.length > 0 && (
                                        <div className="absolute z-20 mt-1 left-0 right-0 bg-[#111111] border border-white/10 rounded-lg shadow-2xl max-h-56 overflow-y-auto">
                                            {productResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onMouseDown={(e) =>
                                                        e.preventDefault()
                                                    }
                                                    onClick={() => {
                                                        setProductId(p.id);
                                                        setProductSearch('');
                                                        setShowProductDropdown(
                                                            false,
                                                        );
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors"
                                                >
                                                    <div className="font-medium">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500">
                                                        {p.barcode}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                            </>
                        )}
                    </div>

                    {/* Branch dropdown — admin only */}
                    {isAdmin && (
                        <div>
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                                Branch
                            </label>
                            <select
                                value={branchId}
                                onChange={(e) => setBranchId(e.target.value)}
                                className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all [color-scheme:dark]"
                            >
                                <option value="">All branches</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
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
                                    <tr
                                        key={i}
                                        className="border-b border-white/5"
                                    >
                                        {[...Array(7)].map((__, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-5 w-24 bg-white/5 rounded animate-pulse" />
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
                                        <p className="text-sm font-medium text-slate-400">
                                            No transfers in this range
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-3 text-xs text-slate-500 hover:text-white transition-colors underline"
                                            >
                                                Clear filters
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => {
                                    const closedAt = terminalAt(item);
                                    const requester = item.requestedBy
                                        ? `${item.requestedBy.firstName} ${item.requestedBy.lastName}`.trim()
                                        : '—';
                                    const qty =
                                        item.approvedQuantity ??
                                        item.requestedQuantity;
                                    return (
                                        <tr
                                            key={item.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
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
                                                <TransferStatusPill
                                                    status={item.status}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-200 font-medium">
                                                    {item.product.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {item.sourceBranch?.name ?? '—'}
                                                <span className="mx-2 text-slate-600">
                                                    →
                                                </span>
                                                <span className="text-slate-300">
                                                    {item.destinationBranch.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right tabular-nums text-slate-300 font-medium">
                                                {qty}
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {requester}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {formatDate(closedAt)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-500 tabular-nums">
                                                {formatDuration(
                                                    item.createdAt,
                                                    closedAt,
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && items.length > 0 && totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                        <span>
                            Page {page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
