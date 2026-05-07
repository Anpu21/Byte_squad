import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import {
    adminService,
    type IInventoryMatrixCell,
    type IInventoryMatrixResponse,
    type IInventoryMatrixRow,
    type IInventoryMatrixBranchColumn,
} from '@/services/admin.service';
import { inventoryService } from '@/services/inventory.service';

interface AdminInventoryPageProps {
    embedded?: boolean;
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

function statusLabel(cell: IInventoryMatrixCell): {
    label: string;
    color: string;
} {
    if (cell.inventoryId === null) {
        return { label: 'No record', color: 'text-slate-500' };
    }
    if (cell.isOutOfStock) {
        return { label: 'Out of Stock', color: 'text-rose-300' };
    }
    if (cell.isLowStock) {
        return { label: 'Low Stock', color: 'text-amber-300' };
    }
    return { label: 'In Stock', color: 'text-emerald-300' };
}

interface DrillDownState {
    row: IInventoryMatrixRow;
    branch: IInventoryMatrixBranchColumn;
    cell: IInventoryMatrixCell;
}

export default function AdminInventoryPage({
    embedded = false,
}: AdminInventoryPageProps) {
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [category, setCategory] = useState('');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [page, setPage] = useState(1);

    const [matrix, setMatrix] = useState<IInventoryMatrixResponse | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

    const fetchMatrix = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await adminService.getInventoryMatrix({
                search: search || undefined,
                category: category || undefined,
                lowStockOnly: lowStockOnly || undefined,
                page,
                limit: 25,
            });
            setMatrix(result);
        } catch {
            setMatrix(null);
        } finally {
            setIsLoading(false);
        }
    }, [search, category, lowStockOnly, page]);

    useEffect(() => {
        fetchMatrix();
    }, [fetchMatrix]);

    useEffect(() => {
        inventoryService
            .getCategories()
            .then(setCategories)
            .catch(() => setCategories([]));
    }, []);

    // Debounce the search input by 300ms.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const changeCategory = (next: string) => {
        setCategory(next);
        setPage(1);
    };

    const toggleLowStockOnly = () => {
        setLowStockOnly((prev) => !prev);
        setPage(1);
    };

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setCategory('');
        setLowStockOnly(false);
        setPage(1);
    };

    const hasActiveFilters =
        search !== '' || category !== '' || lowStockOnly;

    const branches = useMemo(() => matrix?.branches ?? [], [matrix]);
    const rows = matrix?.rows ?? [];
    const total = matrix?.total ?? 0;
    const totalPages = matrix?.totalPages ?? 1;

    const branchById = useMemo(
        () => new Map(branches.map((b) => [b.id, b])),
        [branches],
    );

    const handleCellClick = (
        row: IInventoryMatrixRow,
        cell: IInventoryMatrixCell,
    ) => {
        const branch = branchById.get(cell.branchId);
        if (!branch) return;
        setDrillDown({ row, branch, cell });
    };

    return (
        <div className={embedded ? '' : 'animate-in fade-in duration-300'}>
            {!embedded && (
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        All Branches Inventory
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Pivot view of every product across every branch.
                    </p>
                </div>
            )}

            {/* Filter bar */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search product name or barcode…"
                            className="w-full h-10 px-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all placeholder:text-slate-600"
                        />
                    </div>

                    {/* Category */}
                    <div className="min-w-[180px]">
                        <select
                            value={category}
                            onChange={(e) => changeCategory(e.target.value)}
                            className="w-full h-10 px-3 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white focus:ring-[3px] focus:ring-white/20 transition-all [color-scheme:dark]"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Low-stock toggle */}
                    <button
                        onClick={toggleLowStockOnly}
                        className={`h-10 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            lowStockOnly
                                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                                : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {lowStockOnly ? '⚠ Low stock only' : 'Low stock only'}
                    </button>

                    {/* Count + clear */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                            {total} {total === 1 ? 'product' : 'products'}
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-slate-500 hover:text-white transition-colors underline whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pivot table */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap sticky left-0 bg-[#0a0a0a] z-10">
                                    Product
                                </th>
                                {branches.map((b) => (
                                    <th
                                        key={b.id}
                                        className="px-4 py-4 font-semibold text-right whitespace-nowrap"
                                    >
                                        {b.name}
                                        {!b.isActive && (
                                            <span className="ml-1 text-[9px] text-slate-600">
                                                (inactive)
                                            </span>
                                        )}
                                    </th>
                                ))}
                                <th className="px-4 py-4 font-semibold text-right whitespace-nowrap text-white/80">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr
                                        key={i}
                                        className="border-b border-white/5"
                                    >
                                        <td className="px-6 py-4 sticky left-0 bg-[#111111]">
                                            <div className="h-5 w-40 bg-white/5 rounded animate-pulse" />
                                        </td>
                                        {[...Array(branches.length || 3)].map(
                                            (__, j) => (
                                                <td
                                                    key={j}
                                                    className="px-4 py-4 text-right"
                                                >
                                                    <div className="h-5 w-12 bg-white/5 rounded animate-pulse ml-auto" />
                                                </td>
                                            ),
                                        )}
                                        <td className="px-4 py-4 text-right">
                                            <div className="h-5 w-12 bg-white/5 rounded animate-pulse ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={branches.length + 2}
                                        className="px-6 py-16 text-center"
                                    >
                                        <p className="text-sm font-medium text-slate-400">
                                            No products match these filters
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
                                rows.map((row) => (
                                    <tr
                                        key={row.productId}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4 sticky left-0 bg-[#111111] group-hover:bg-[#141414]">
                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                                            ':productId',
                                                            row.productId,
                                                        ),
                                                    )
                                                }
                                                className="text-left"
                                            >
                                                <div className="text-slate-200 font-medium hover:text-white transition-colors">
                                                    {row.productName}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">
                                                    {row.barcode} ·{' '}
                                                    {row.category}
                                                </div>
                                            </button>
                                        </td>
                                        {row.cells.map((cell) => {
                                            const tint = cell.isOutOfStock
                                                ? cell.inventoryId === null
                                                    ? 'text-slate-700'
                                                    : 'bg-rose-500/10 text-rose-300'
                                                : cell.isLowStock
                                                  ? 'bg-amber-500/10 text-amber-200'
                                                  : 'text-slate-200';
                                            return (
                                                <td
                                                    key={cell.branchId}
                                                    onClick={() =>
                                                        handleCellClick(
                                                            row,
                                                            cell,
                                                        )
                                                    }
                                                    className={`px-4 py-4 text-right tabular-nums font-medium cursor-pointer ${tint}`}
                                                >
                                                    {cell.inventoryId ===
                                                    null ? (
                                                        <span title="No inventory record">
                                                            —
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5">
                                                            {(cell.isLowStock ||
                                                                (cell.isOutOfStock &&
                                                                    cell.inventoryId !==
                                                                        null)) && (
                                                                <span className="text-xs">
                                                                    ⚠
                                                                </span>
                                                            )}
                                                            {cell.quantity}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-white">
                                            {row.totalQuantity}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && rows.length > 0 && totalPages > 1 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                        <span>
                            Page {matrix?.page ?? page} of {totalPages}
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

            {/* Drill-down modal */}
            {drillDown && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setDrillDown(null)}
                >
                    <div
                        className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4">
                            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                                {drillDown.branch.name}
                            </p>
                            <h3 className="text-lg font-semibold text-white">
                                {drillDown.row.productName}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {drillDown.row.barcode} ·{' '}
                                {drillDown.row.category}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                                    Quantity
                                </p>
                                <p className="text-2xl font-bold text-white tabular-nums mt-1">
                                    {drillDown.cell.quantity}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                                    Threshold
                                </p>
                                <p className="text-2xl font-bold text-slate-300 tabular-nums mt-1">
                                    {drillDown.cell.lowStockThreshold ?? '—'}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 col-span-2">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                                    Status
                                </p>
                                <p
                                    className={`text-sm font-semibold mt-1 ${statusLabel(drillDown.cell).color}`}
                                >
                                    {statusLabel(drillDown.cell).label}
                                </p>
                            </div>
                            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 col-span-2">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                                    Last restocked
                                </p>
                                <p className="text-sm text-slate-300 mt-1">
                                    {formatDateTime(
                                        drillDown.cell.lastRestockedAt,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDrillDown(null)}
                                className="h-9 px-4 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() =>
                                    navigate(
                                        FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                            ':productId',
                                            drillDown.row.productId,
                                        ),
                                    )
                                }
                                className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all"
                            >
                                Edit product details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
