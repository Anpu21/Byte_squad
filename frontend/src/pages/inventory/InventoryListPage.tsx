import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Search,
    Pencil,
    Trash2,
    Package,
    ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import { inventoryService } from '@/services/inventory.service';
import type { IInventoryItem } from '@/services/inventory.service';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import ExportMenu from '@/components/common/ExportMenu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import StatusPill from '@/components/ui/StatusPill';
import EmptyState from '@/components/ui/EmptyState';

interface InventoryExportRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    status: string;
    costPrice: number;
    sellingPrice: number;
}

const STOCK_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'in_stock', label: 'In stock' },
    { value: 'low_stock', label: 'Low stock' },
    { value: 'out_of_stock', label: 'Out of stock' },
];

function getStockKey(item: IInventoryItem): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (item.quantity === 0) return 'out_of_stock';
    if (item.quantity <= item.lowStockThreshold) return 'low_stock';
    return 'in_stock';
}

export default function InventoryListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const {
        items,
        categories,
        total,
        totalPages,
        isLoading,
        search,
        setSearch,
        category,
        setCategory,
        stockStatus,
        setStockStatus,
        page,
        setPage,
        refetch,
    } = useInventory();

    const [deleteTarget, setDeleteTarget] = useState<IInventoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const hasActiveFilter =
        search !== '' || category !== '' || stockStatus !== '';

    const resetFilters = () => {
        setSearch('');
        setCategory('');
        setStockStatus('');
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await inventoryService.deleteProduct(deleteTarget.productId);
            toast.success('Product deleted');
            setDeleteTarget(null);
            refetch();
        } catch (err) {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? String(err.response.data.message)
                    : 'Failed to delete product';
            toast.error(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleExport = async (format: ExportFormat) => {
        if (!user?.branchId) return;
        try {
            setIsExporting(true);
            const result = await inventoryService.getByBranch(user.branchId, {
                search: search || undefined,
                category: category || undefined,
                stockStatus: stockStatus || undefined,
                page: 1,
                limit: 10000,
            });
            const allItems = result.items ?? [];

            const stockLabel: Record<string, string> = {
                in_stock: 'In Stock',
                low_stock: 'Low Stock',
                out_of_stock: 'Out of Stock',
            };

            const exportRows: InventoryExportRow[] = allItems.map((item) => ({
                productName: item.product.name,
                barcode: item.product.barcode,
                category: item.product.category,
                quantity: item.quantity,
                status: stockLabel[getStockKey(item)] ?? '',
                costPrice: Number(item.product.costPrice),
                sellingPrice: Number(item.product.sellingPrice),
            }));

            const columns: ExportColumn<InventoryExportRow>[] = [
                { header: 'Product Name', key: 'productName' },
                { header: 'Barcode', key: 'barcode' },
                { header: 'Category', key: 'category' },
                { header: 'Stock', key: 'quantity', align: 'right' },
                { header: 'Status', key: 'status' },
                { header: 'Cost Price', key: 'costPrice', align: 'right', format: 'currency' },
                { header: 'Selling Price', key: 'sellingPrice', align: 'right', format: 'currency' },
            ];

            const totalProducts = allItems.length;
            const lowStock = allItems.filter(
                (i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold,
            ).length;
            const outOfStock = allItems.filter((i) => i.quantity === 0).length;
            const totalStockValue = allItems.reduce(
                (acc, i) => acc + Number(i.quantity) * Number(i.product.costPrice),
                0,
            );

            const filterParts: string[] = [];
            if (category) filterParts.push(`Category: ${category}`);
            if (stockStatus) {
                filterParts.push(
                    `Status: ${stockLabel[stockStatus] ?? stockStatus}`,
                );
            }
            if (search) filterParts.push(`Search: "${search}"`);
            const subtitle =
                filterParts.length > 0 ? filterParts.join('  ·  ') : 'All products';

            await exportData(format, exportRows, columns, {
                title: 'Inventory Report',
                subtitle,
                filenameBase: 'inventory',
                companyName: 'LedgerPro',
                generatedBy: user
                    ? `${user.firstName} ${user.lastName}`
                    : undefined,
                summary: [
                    { label: 'Total Products', value: String(totalProducts) },
                    { label: 'Low Stock', value: String(lowStock) },
                    { label: 'Out of Stock', value: String(outOfStock) },
                    {
                        label: 'Total Stock Value',
                        value: formatCurrency(totalStockValue),
                    },
                ],
            });
        } catch {
            toast.error('Could not generate export — please try again');
        } finally {
            setIsExporting(false);
        }
    };

    const limit = 10;
    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const getPageNumbers = (): (number | '...')[] => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (
                let i = Math.max(2, page - 1);
                i <= Math.min(totalPages - 1, page + 1);
                i++
            ) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-1.5">
                        Inventory
                    </p>
                    <h1 className="text-3xl font-bold text-text-1 tracking-tight leading-none">
                        Products
                    </h1>
                    <p className="text-sm text-text-2 mt-1.5">
                        {total} {total === 1 ? 'product' : 'products'} in your
                        catalog
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <ExportMenu
                        onExport={handleExport}
                        disabled={total === 0}
                        isPreparing={isExporting}
                    />
                    <Button
                        type="button"
                        onClick={() => navigate(FRONTEND_ROUTES.INVENTORY_ADD)}
                    >
                        <Plus size={14} /> Add product
                    </Button>
                </div>
            </div>

            {/* Two-column body */}
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left rail */}
                <aside className="w-full lg:w-60 lg:flex-shrink-0">
                    <Card className="p-4">
                        {/* Search */}
                        <div>
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Search
                            </p>
                            <div className="relative">
                                <Search
                                    size={14}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                                />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or barcode"
                                    className="w-full h-9 pl-9 pr-3 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/25 placeholder:text-text-3 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Stock status */}
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Stock status
                            </p>
                            <div className="flex flex-col gap-1">
                                {STOCK_OPTIONS.map((opt) => {
                                    const selected = stockStatus === opt.value;
                                    return (
                                        <label
                                            key={opt.value || 'all'}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                                selected
                                                    ? 'bg-accent-soft text-accent-text'
                                                    : 'text-text-1 hover:bg-surface-2'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="stock-status"
                                                value={opt.value}
                                                checked={selected}
                                                onChange={() =>
                                                    setStockStatus(opt.value)
                                                }
                                                style={{
                                                    accentColor:
                                                        'var(--accent)',
                                                }}
                                            />
                                            <span>{opt.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Category */}
                        <div className="border-t border-border pt-4 mt-4">
                            <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                Category
                            </p>
                            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                                <label
                                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                        category === ''
                                            ? 'bg-accent-soft text-accent-text'
                                            : 'text-text-1 hover:bg-surface-2'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value=""
                                        checked={category === ''}
                                        onChange={() => setCategory('')}
                                        style={{
                                            accentColor: 'var(--accent)',
                                        }}
                                    />
                                    <span>All</span>
                                </label>
                                {categories.map((c) => {
                                    const selected = category === c;
                                    return (
                                        <label
                                            key={c}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-[13px] transition-colors ${
                                                selected
                                                    ? 'bg-accent-soft text-accent-text'
                                                    : 'text-text-1 hover:bg-surface-2'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="category"
                                                value={c}
                                                checked={selected}
                                                onChange={() => setCategory(c)}
                                                style={{
                                                    accentColor:
                                                        'var(--accent)',
                                                }}
                                            />
                                            <span className="truncate">{c}</span>
                                        </label>
                                    );
                                })}
                                {categories.length === 0 && (
                                    <p className="text-xs text-text-3 px-2 py-1">
                                        No categories yet
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Reset all */}
                        <div className="border-t border-border pt-4 mt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={resetFilters}
                                disabled={!hasActiveFilter}
                            >
                                Reset all
                            </Button>
                        </div>
                    </Card>
                </aside>

                {/* Right content */}
                <div className="flex-1 min-w-0">
                    {/* Hero KPI */}
                    <Card className="p-6 border-l-2 border-l-accent mb-3">
                        <div className="flex items-end justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                                    Active products
                                </p>
                                <p className="mono text-4xl font-semibold text-text-1 tracking-tight leading-none">
                                    {total}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                                    Categories
                                </p>
                                <p className="mono text-2xl font-semibold text-text-1 mt-1">
                                    {categories.length}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Active filter chips */}
                    {hasActiveFilter && (
                        <div className="flex flex-wrap items-center gap-2 mb-4 px-1">
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <Search size={11} />
                                    <span>&ldquo;{search}&rdquo;</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            {stockStatus && (
                                <button
                                    type="button"
                                    onClick={() => setStockStatus('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <span>
                                        {STOCK_OPTIONS.find(
                                            (o) => o.value === stockStatus,
                                        )?.label ?? stockStatus}
                                    </span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            {category && (
                                <button
                                    type="button"
                                    onClick={() => setCategory('')}
                                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-accent-soft text-accent-text text-xs font-medium hover:opacity-80 transition-opacity"
                                >
                                    <span>{category}</span>
                                    <X size={12} className="opacity-70" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="text-xs text-text-3 hover:text-text-1 underline-offset-4 hover:underline transition-colors"
                            >
                                Reset all
                            </button>
                            <span className="ml-auto text-xs text-text-3">
                                {total} matches
                            </span>
                        </div>
                    )}

                    {/* List */}
                    {isLoading ? (
                        <ul className="flex flex-col gap-2">
                            {[...Array(5)].map((_, i) => (
                                <li
                                    key={i}
                                    className="h-[68px] bg-surface-2 rounded-md animate-pulse"
                                />
                            ))}
                        </ul>
                    ) : items.length === 0 ? (
                        <Card>
                            <EmptyState
                                icon={<Package size={20} />}
                                title="No products found"
                                description={
                                    hasActiveFilter
                                        ? 'No products match the current filters.'
                                        : 'Add your first product to start tracking inventory.'
                                }
                                action={
                                    hasActiveFilter ? (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={resetFilters}
                                            size="md"
                                        >
                                            Reset filters
                                        </Button>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    FRONTEND_ROUTES.INVENTORY_ADD,
                                                )
                                            }
                                            size="md"
                                        >
                                            <Plus size={14} /> Add product
                                        </Button>
                                    )
                                }
                            />
                        </Card>
                    ) : (
                        <>
                            <ul className="flex flex-col gap-2">
                                {items.map((item) => {
                                    const stockKey = getStockKey(item);
                                    const stockEmpty = item.quantity === 0;
                                    return (
                                        <li key={item.id}>
                                            <Card className="group p-3 hover:border-border-strong hover:bg-surface-2 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-md bg-surface-2 border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                                                        {item.product.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={
                                                                    item.product
                                                                        .imageUrl
                                                                }
                                                                alt={
                                                                    item.product
                                                                        .name
                                                                }
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon
                                                                size={18}
                                                                className="text-text-3"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-text-1 font-medium truncate">
                                                            {item.product.name}
                                                        </p>
                                                        <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                                                            {item.product.barcode}
                                                        </p>
                                                    </div>

                                                    <div className="flex-shrink-0 hidden sm:block">
                                                        <Pill
                                                            tone="neutral"
                                                            dot={false}
                                                        >
                                                            {item.product.category}
                                                        </Pill>
                                                    </div>

                                                    <div className="flex-shrink-0">
                                                        <StatusPill
                                                            status={stockKey}
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-end flex-shrink-0 w-20">
                                                        <p
                                                            className={`mono text-sm font-semibold ${
                                                                stockEmpty
                                                                    ? 'text-text-3'
                                                                    : 'text-text-1'
                                                            }`}
                                                        >
                                                            {item.quantity}
                                                        </p>
                                                        <p className="mono text-[11px] text-text-3 mt-0.5">
                                                            {formatCurrency(
                                                                Number(
                                                                    item.product
                                                                        .sellingPrice,
                                                                ),
                                                            )}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/inventory/edit/${item.productId}`,
                                                                )
                                                            }
                                                            className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors"
                                                            title="Edit"
                                                            aria-label="Edit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    item,
                                                                )
                                                            }
                                                            className="p-1.5 text-text-3 hover:text-danger rounded-md hover:bg-danger-soft transition-colors"
                                                            title="Delete"
                                                            aria-label="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </Card>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-4 px-1 flex items-center justify-between text-xs text-text-3">
                                    <span>
                                        Showing {startItem} – {endItem} of{' '}
                                        {total}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                            className="p-1.5 rounded-md border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>
                                        {getPageNumbers().map((p, i) =>
                                            p === '...' ? (
                                                <span
                                                    key={`dots-${i}`}
                                                    className="px-2"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setPage(p)}
                                                    className={`min-w-[28px] h-7 px-2 rounded-md text-xs transition-colors ${
                                                        p === page
                                                            ? 'bg-accent-soft text-accent-text font-semibold'
                                                            : 'border border-border hover:bg-surface-2 hover:text-text-1'
                                                    }`}
                                                >
                                                    {p}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === totalPages}
                                            className="p-1.5 rounded-md border border-border hover:bg-surface-2 hover:text-text-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Next page"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    style={{ background: 'var(--overlay)' }}
                >
                    <Card className="w-full max-w-sm p-6">
                        <h3 className="text-base font-semibold text-text-1 mb-2">
                            Delete product
                        </h3>
                        <p className="text-sm text-text-2 mb-5">
                            Are you sure you want to delete{' '}
                            <span className="text-text-1 font-medium">
                                {deleteTarget.product.name}
                            </span>
                            ? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="danger"
                                size="md"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
