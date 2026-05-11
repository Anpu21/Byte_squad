import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { adminService } from '@/services/admin.service';
import { inventoryService } from '@/services/inventory.service';
import type {
    IInventoryMatrixCell,
    IInventoryMatrixResponse,
    IInventoryMatrixRow,
    IInventoryMatrixBranchColumn,
} from '@/types';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import StatusPill from '@/components/ui/StatusPill';
import InventoryKpiStrip from './inventory/InventoryKpiStrip';
import BranchHealthRow from './inventory/BranchHealthRow';
import InventoryToolbar, {
    type ActiveFilter,
    type InventoryView,
} from './inventory/InventoryToolbar';

interface AdminInventoryPageProps {
    embedded?: boolean;
}

const VIEW_VALUES: InventoryView[] = [
    'all',
    'low_stock',
    'out_of_stock',
    'healthy',
];

function parseView(v: string | null): InventoryView {
    return VIEW_VALUES.includes(v as InventoryView)
        ? (v as InventoryView)
        : 'all';
}

function formatDateTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
}

interface CellStatus {
    status: string;
    label: string;
}

function cellStatus(cell: IInventoryMatrixCell): CellStatus {
    if (cell.inventoryId === null)
        return { status: 'invited', label: 'No record' };
    if (cell.isOutOfStock)
        return { status: 'out_of_stock', label: 'Out of stock' };
    if (cell.isLowStock) return { status: 'low', label: 'Low stock' };
    return { status: 'in_stock', label: 'In stock' };
}

function rowMatchesView(
    row: IInventoryMatrixRow,
    view: InventoryView,
): boolean {
    const hasOut = row.cells.some(
        (c) => c.isOutOfStock && c.inventoryId !== null,
    );
    const hasLow = row.cells.some((c) => c.isLowStock);
    switch (view) {
        case 'all':
            return true;
        case 'low_stock':
            return hasLow || hasOut;
        case 'out_of_stock':
            return hasOut;
        case 'healthy':
            return !hasOut && !hasLow;
    }
}

const VIEW_LABELS: Record<InventoryView, string> = {
    all: 'All',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock',
    healthy: 'Healthy',
};

interface DrillDownState {
    row: IInventoryMatrixRow;
    branch: IInventoryMatrixBranchColumn;
    cell: IInventoryMatrixCell;
}

export default function AdminInventoryPage({
    embedded = false,
}: AdminInventoryPageProps) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const search = searchParams.get('q') ?? '';
    const category = searchParams.get('category') ?? '';
    const view = parseView(searchParams.get('view'));
    const page = Number(searchParams.get('page') ?? '1') || 1;

    const [searchInput, setSearchInput] = useState(search);
    const [matrix, setMatrix] = useState<IInventoryMatrixResponse | null>(null);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

    const updateParams = useCallback(
        (updates: Record<string, string | number | null>) => {
            setSearchParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    for (const [k, v] of Object.entries(updates)) {
                        if (
                            v === null ||
                            v === '' ||
                            (k === 'page' && v === 1)
                        ) {
                            next.delete(k);
                        } else {
                            next.set(k, String(v));
                        }
                    }
                    return next;
                },
                { replace: true },
            );
        },
        [setSearchParams],
    );

    // Server filter: out-of-stock products are a subset of low+out, so we
    // can pass lowStockOnly=true for both `low_stock` and `out_of_stock`
    // views and refine client-side. `healthy` and `all` use no server filter.
    const lowStockOnly = view === 'low_stock' || view === 'out_of_stock';

    const fetchMatrix = useCallback(async () => {
        setIsLoading(true);
        setError(null);
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
            setError('Could not load inventory matrix.');
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

    // Debounce searchInput → URL by 300ms.
    useEffect(() => {
        if (searchInput === search) return;
        const timer = setTimeout(() => {
            updateParams({ q: searchInput || null, page: 1 });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, search, updateParams]);

    const branches = useMemo(() => matrix?.branches ?? [], [matrix]);
    const total = matrix?.total ?? 0;
    const totalPages = matrix?.totalPages ?? 1;

    // Apply view filter client-side (server supports only lowStockOnly).
    const visibleRows = useMemo(() => {
        if (!matrix) return [];
        return matrix.rows.filter((r) => rowMatchesView(r, view));
    }, [matrix, view]);

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

    const clearAllFilters = useCallback(() => {
        setSearchInput('');
        setSearchParams(new URLSearchParams(), { replace: true });
    }, [setSearchParams]);

    const activeFilters: ActiveFilter[] = [];
    if (search) {
        activeFilters.push({
            label: `"${search}"`,
            clear: () => {
                setSearchInput('');
                updateParams({ q: null, page: 1 });
            },
        });
    }
    if (category) {
        activeFilters.push({
            label: category,
            clear: () => updateParams({ category: null, page: 1 }),
        });
    }
    if (view !== 'all') {
        activeFilters.push({
            label: VIEW_LABELS[view],
            clear: () => updateParams({ view: null, page: 1 }),
        });
    }

    const drillStatus = drillDown ? cellStatus(drillDown.cell) : null;

    return (
        <div className={embedded ? '' : 'animate-in fade-in duration-300'}>
            {!embedded && (
                <PageHeader
                    title="All Branches Inventory"
                    subtitle="Pivot view of every product across every branch"
                />
            )}

            <InventoryKpiStrip matrix={matrix} />
            <BranchHealthRow matrix={matrix} />

            <InventoryToolbar
                searchInput={searchInput}
                onSearchInputChange={setSearchInput}
                category={category}
                categories={categories}
                onCategoryChange={(v) =>
                    updateParams({ category: v || null, page: 1 })
                }
                view={view}
                onViewChange={(v) =>
                    updateParams({ view: v === 'all' ? null : v, page: 1 })
                }
                visibleCount={visibleRows.length}
                totalCount={total}
                activeFilters={activeFilters}
                onClearAll={clearAllFilters}
            />

            <Card>
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
                                <th className="px-4 py-4 font-semibold text-right whitespace-nowrap">
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
                            ) : visibleRows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={branches.length + 2}
                                        className="p-8"
                                    >
                                        <EmptyState
                                            icon={<Package size={20} />}
                                            title={
                                                error
                                                    ? 'Could not load inventory'
                                                    : 'No products match'
                                            }
                                            description={
                                                error
                                                    ? error
                                                    : activeFilters.length > 0
                                                      ? 'Try widening your filters or clear all to see everything.'
                                                      : 'No products in the catalog yet.'
                                            }
                                            action={
                                                error ? (
                                                    <Button
                                                        onClick={fetchMatrix}
                                                    >
                                                        Retry
                                                    </Button>
                                                ) : activeFilters.length > 0 ? (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={clearAllFilters}
                                                    >
                                                        Reset filters
                                                    </Button>
                                                ) : null
                                            }
                                        />
                                    </td>
                                </tr>
                            ) : (
                                visibleRows.map((row) => (
                                    <tr
                                        key={row.productId}
                                        className="border-b border-border hover:bg-surface-2 transition-colors group"
                                    >
                                        <td className="px-6 py-4 sticky left-0 bg-surface group-hover:bg-surface-2">
                                            <button
                                                type="button"
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
                                                                cell.isOutOfStock) && (
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

                {!isLoading && visibleRows.length > 0 && totalPages > 1 && (
                    <div className="p-4 border-t border-border flex items-center justify-between text-xs text-text-3 bg-canvas/50">
                        <span>
                            Page {matrix?.page ?? page} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    updateParams({ page: page - 1 })
                                }
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() =>
                                    updateParams({ page: page + 1 })
                                }
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={drillDown !== null}
                onClose={() => setDrillDown(null)}
                title={
                    drillDown
                        ? `${drillDown.row.productName} · ${drillDown.branch.name}`
                        : ''
                }
                maxWidth="md"
            >
                {drillDown && drillStatus && (
                    <div>
                        <p className="text-xs text-text-3 mb-4">
                            {drillDown.row.barcode} · {drillDown.row.category}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-canvas border border-border rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Quantity
                                </p>
                                <p className="text-2xl font-bold text-text-1 tabular-nums mt-1">
                                    {drillDown.cell.quantity}
                                </p>
                            </div>
                            <div className="bg-canvas border border-border rounded-md p-3">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold">
                                    Threshold
                                </p>
                                <p className="text-2xl font-bold text-text-1 tabular-nums mt-1">
                                    {drillDown.cell.lowStockThreshold ?? '—'}
                                </p>
                            </div>
                            <div className="bg-canvas border border-border rounded-md p-3 col-span-2">
                                <p className="text-[10px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                    Status
                                </p>
                                <StatusPill
                                    status={drillStatus.status}
                                    label={drillStatus.label}
                                />
                            </div>
                            <div className="bg-canvas border border-border rounded-md p-3 col-span-2">
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

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => setDrillDown(null)}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() =>
                                    navigate(
                                        FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                            ':productId',
                                            drillDown.row.productId,
                                        ),
                                    )
                                }
                            >
                                Edit product
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
