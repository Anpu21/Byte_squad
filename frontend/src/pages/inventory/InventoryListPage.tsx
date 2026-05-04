import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import toast from 'react-hot-toast';
import axios from 'axios';

interface InventoryExportRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    status: string;
    costPrice: number;
    sellingPrice: number;
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

    const getStockStatus = (item: IInventoryItem) => {
        if (item.quantity === 0) return 'Out of Stock';
        if (item.quantity <= item.lowStockThreshold) return 'Low Stock';
        return 'In Stock';
    };

    const getStatusBadge = (item: IInventoryItem) => {
        const status = getStockStatus(item);
        switch (status) {
            case 'In Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-white/10 text-white border border-white/20">In Stock</span>;
            case 'Low Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-300 border border-white/20">Low Stock</span>;
            case 'Out of Stock':
                return <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium bg-transparent text-slate-500 border border-white/10 border-dashed">Out of Stock</span>;
            default:
                return null;
        }
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

            const exportRows: InventoryExportRow[] = allItems.map((item) => ({
                productName: item.product.name,
                barcode: item.product.barcode,
                category: item.product.category,
                quantity: item.quantity,
                status: getStockStatus(item),
                costPrice: Number(item.product.costPrice),
                sellingPrice: Number(item.product.sellingPrice),
            }));

            const columns: ExportColumn<InventoryExportRow>[] = [
                { header: 'Product Name', key: 'productName' },
                { header: 'Barcode', key: 'barcode' },
                { header: 'Category', key: 'category' },
                { header: 'Stock', key: 'quantity', align: 'right' },
                { header: 'Status', key: 'status' },
                {
                    header: 'Cost Price',
                    key: 'costPrice',
                    align: 'right',
                    format: 'currency',
                },
                {
                    header: 'Selling Price',
                    key: 'sellingPrice',
                    align: 'right',
                    format: 'currency',
                },
            ];

            const totalProducts = allItems.length;
            const lowStock = allItems.filter(
                (i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold,
            ).length;
            const outOfStock = allItems.filter((i) => i.quantity === 0).length;
            const totalStockValue = allItems.reduce(
                (acc, i) =>
                    acc + Number(i.quantity) * Number(i.product.costPrice),
                0,
            );

            const filterParts: string[] = [];
            if (category) filterParts.push(`Category: ${category}`);
            if (stockStatus) {
                const labels: Record<string, string> = {
                    in_stock: 'In Stock',
                    low_stock: 'Low Stock',
                    out_of_stock: 'Out of Stock',
                };
                filterParts.push(
                    `Status: ${labels[stockStatus] ?? stockStatus}`,
                );
            }
            if (search) filterParts.push(`Search: "${search}"`);
            const subtitle =
                filterParts.length > 0
                    ? filterParts.join('  ·  ')
                    : 'All products';

            await exportData(format, exportRows, columns, {
                title: 'Inventory Report',
                subtitle,
                filenameBase: 'inventory',
                companyName: 'LedgerPro',
                generatedBy: user
                    ? `${user.firstName} ${user.lastName}`
                    : undefined,
                summary: [
                    {
                        label: 'Total Products',
                        value: String(totalProducts),
                    },
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
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    const getPageNumbers = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (page > 3) pages.push('...');
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                pages.push(i);
            }
            if (page < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Inventory</h1>
                    <p className="text-sm text-slate-400 mt-1">Manage your product catalog and stock levels</p>
                </div>

                <div className="flex items-center gap-3">
                    <ExportMenu
                        onExport={handleExport}
                        disabled={total === 0}
                        isPreparing={isExporting}
                    />
                    <button
                        onClick={() => navigate(FRONTEND_ROUTES.INVENTORY_ADD)}
                        className="h-9 px-4 rounded-lg bg-white text-slate-900 text-sm font-bold hover:shadow-[0_4px_12px_rgba(255,255,255,0.2)] transition-all flex items-center gap-2"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Product
                    </button>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                {/* Table Controls (Search & Filter) */}
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-between bg-white/[0.02]">
                    <div className="relative w-full sm:w-80">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products or barcode..."
                            className="w-full h-9 pl-9 pr-4 bg-[#0a0a0a] border border-white/10 rounded-lg text-sm text-slate-200 outline-none focus:border-white/30 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <select
                            value={stockStatus}
                            onChange={(e) => setStockStatus(e.target.value)}
                            className="h-9 bg-[#0a0a0a] border border-white/10 text-slate-300 text-sm rounded-lg px-3 outline-none focus:border-white/30 cursor-pointer appearance-none"
                        >
                            <option value="">Stock Status</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="out_of_stock">Out of Stock</option>
                        </select>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-slate-500 bg-[#0a0a0a]/50">
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Product</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Category</th>
                                <th className="px-6 py-4 font-semibold whitespace-nowrap">Status</th>
                                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Stock</th>
                                <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Price</th>
                                <th className="px-6 py-4 font-semibold text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="px-6 py-4"><div className="h-5 w-48 bg-white/5 rounded animate-pulse" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-24 bg-white/5 rounded animate-pulse" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-20 bg-white/5 rounded animate-pulse" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-12 bg-white/5 rounded animate-pulse ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-20 bg-white/5 rounded animate-pulse ml-auto" /></td>
                                        <td className="px-6 py-4"><div className="h-5 w-16 bg-white/5 rounded animate-pulse mx-auto" /></td>
                                    </tr>
                                ))
                            ) : !items || items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="text-slate-500">
                                            <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                                                <line x1="12" y1="22.08" x2="12" y2="12"/>
                                            </svg>
                                            <p className="text-sm font-medium text-slate-400">No products found</p>
                                            <p className="text-xs mt-1">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-medium">{item.product.name}</span>
                                                <span className="text-[11px] text-slate-500 font-mono tracking-wider mt-0.5">{item.product.barcode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            {item.product.category}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(item)}
                                        </td>
                                        <td className={`px-6 py-4 text-right tabular-nums font-medium ${item.quantity === 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums text-white font-medium">
                                            {formatCurrency(item.product.sellingPrice)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => navigate(`/inventory/edit/${item.productId}`)}
                                                    className="p-1.5 text-slate-500 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                                                        <path d="m15 5 4 4"/>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(item)}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6"/>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!isLoading && items.length > 0 && (
                    <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500 bg-[#0a0a0a]/50">
                        <span>Showing {startItem} to {endItem} of {total} products</span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === '...' ? (
                                    <span key={`dots-${i}`} className="px-2">...</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-3 py-1.5 rounded border border-white/10 transition-colors ${
                                            p === page
                                                ? 'bg-white/10 text-white font-medium'
                                                : 'hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}
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

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#111111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Product</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            Are you sure you want to delete <span className="text-white font-medium">{deleteTarget.product.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="h-9 px-4 rounded-lg border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-9 px-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
