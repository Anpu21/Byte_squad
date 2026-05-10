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
import Modal from '@/components/ui/Modal';

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
        return { label: 'No record', color: 'text-text-3' };
    }
    if (cell.isOutOfStock) {
        return { label: 'Out of Stock', color: 'text-danger' };
    }
    if (cell.isLowStock) {
        return { label: 'Low Stock', color: 'text-warning' };
    }
    return { label: 'In Stock', color: 'text-accent-text' };
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
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        All Branches Inventory
                    </h1>
                    <p className="text-sm text-text-3 mt-1">
                        Pivot view of every product across every branch.
                    </p>
                </div>
            )}

            {/* Filter bar */}
            <div className="bg-surface border border-border rounded-md p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Search */}
                    <div className="flex-1 min-w-0">
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search product name or barcode…"
                            className="w-full h-10 px-4 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3"
                        />
                    </div>

                    {/* Category */}
                    <div className="min-w-[180px]">
                        <select
                            value={category}
                            onChange={(e) => changeCategory(e.target.value)}
                            className="w-full h-10 px-3 bg-canvas border border-border rounded-lg text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all"
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
                                ? 'bg-warning-soft border border-warning/50 text-warning'
                                : 'bg-canvas border border-border text-text-2 hover:text-text-1 hover:bg-surface-2'
                        }`}
                    >
                        {lowStockOnly ? '⚠ Low stock only' : 'Low stock only'}
                    </button>

                    {/* Count + clear */}
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                            {total} {total === 1 ? 'product' : 'products'}
                        </span>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-text-3 hover:text-text-1 transition-colors underline whitespace-nowrap"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pivot table */}
            <div className="bg-surface border border-border rounded-md shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-[11px] uppercase tracking-widest text-text-3 bg-canvas/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap sticky left-0 bg-canvas z-10">
                                    Product
                                </th>
                                {branches.map((b) => (
                                    <th
                                        key={b.id}
                                        className="px-4 py-4 font-semibold text-right whitespace-nowrap"
                                    >
                                        {b.name}
                                        {!b.isActive && (
                                            <span className="ml-1 text-[9px] text-text-3">
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
                                        className="border-b border-border"
                                    >
                                        <td className="px-6 py-4 sticky left-0 bg-surface">
                                            <div className="h-5 w-40 bg-surface-2 rounded animate-pulse" />
                                        </td>
                                        {[...Array(branches.length || 3)].map(
                                            (__, j) => (
                                                <td
                                                    key={j}
                                                    className="px-4 py-4 text-right"
                                                >
                                                    <div className="h-5 w-12 bg-surface-2 rounded animate-pulse ml-auto" />
                                                </td>
                                            ),
                                        )}
                                        <td className="px-4 py-4 text-right">
                                            <div className="h-5 w-12 bg-surface-2 rounded animate-pulse ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={branches.length + 2}
                                        className="px-6 py-16 text-center"
                                    >
                                        <p className="text-sm font-medium text-text-2">
                                            No products match these filters
                                        </p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-3 text-xs text-text-3 hover:text-text-1 transition-colors underline"
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
                                        className="border-b border-border hover:bg-surface-2 transition-colors group"
                                    >
                                        <td className="px-6 py-4 sticky left-0 bg-surface group-hover:bg-surface-2">
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
                                                <div className="text-text-1 font-medium hover:text-text-1 transition-colors">
                                                    {row.productName}
                                                </div>
                                                <div className="text-[11px] text-text-3 mt-0.5">
                                                    {row.barcode} ·{' '}
                                                    {row.category}
                                                </div>
                                            </button>
                                        </td>
                                        {row.cells.map((cell) => {
                                            const tint = cell.isOutOfStock
                                                ? cell.inventoryId === null
                                                    ? 'text-text-3'
                                                    : 'bg-danger-soft text-danger'
                                                : cell.isLowStock
                                                  ? 'bg-warning-soft text-warning'
                                                  : 'text-text-1';
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
                                        <td className="px-4 py-4 text-right tabular-nums font-semibold text-text-1">
                                            {row.totalQuantity}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && rows.length > 0 && totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-canvas/50">
                        <span>
                            Page {matrix?.page ?? page} of {totalPages}
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

            {/* Drill-down modal */}
            <Modal
                isOpen={drillDown !== null}
                onClose={() => setDrillDown(null)}
                title={drillDown ? `${drillDown.row.productName} · ${drillDown.branch.name}` : ''}
                maxWidth="md"
            >
                {drillDown && (
                <div>
                        <p className="text-xs text-text-3 mb-4">
                            {drillDown.row.barcode} · {drillDown.row.category}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-canvas border border-border rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Quantity
                                </p>
                                <p className="text-2xl font-bold text-text-1 tabular-nums mt-1">
                                    {drillDown.cell.quantity}
                                </p>
                            </div>
                            <div className="bg-canvas border border-border rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Threshold
                                </p>
                                <p className="text-2xl font-bold text-text-1 tabular-nums mt-1">
                                    {drillDown.cell.lowStockThreshold ?? '—'}
                                </p>
                            </div>
                            <div className="bg-canvas border border-border rounded-xl p-3 col-span-2">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Status
                                </p>
                                <p
                                    className={`text-sm font-semibold mt-1 ${statusLabel(drillDown.cell).color}`}
                                >
                                    {statusLabel(drillDown.cell).label}
                                </p>
                            </div>
                            <div className="bg-canvas border border-border rounded-xl p-3 col-span-2">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Last restocked
                                </p>
                                <p className="text-sm text-text-1 mt-1">
                                    {formatDateTime(
                                        drillDown.cell.lastRestockedAt,
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDrillDown(null)}
                                className="h-9 px-4 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
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
                                className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all"
                            >
                                Edit product details
                            </button>
                        </div>
                </div>
                )}
            </Modal>
        </div>
    );
}
