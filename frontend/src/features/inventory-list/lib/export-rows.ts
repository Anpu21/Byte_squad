import { inventoryService } from '@/services/inventory.service';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import { STOCK_LABEL, getStockKey } from './stock-key';
import type { StockKey } from '../types/stock-key.type';

interface InventoryExportRow {
    productName: string;
    barcode: string;
    category: string;
    quantity: number;
    status: string;
    costPrice: number;
    sellingPrice: number;
}

interface ExportArgs {
    branchId: string;
    filters: {
        search: string;
        category: string;
        stockStatus: '' | StockKey;
    };
    user: { firstName: string; lastName: string } | null;
    format: ExportFormat;
}

const EXPORT_FETCH_LIMIT = 10000;

export async function exportInventoryRows({
    branchId,
    filters,
    user,
    format,
}: ExportArgs): Promise<void> {
    const result = await inventoryService.getByBranch(branchId, {
        search: filters.search || undefined,
        category: filters.category || undefined,
        stockStatus: filters.stockStatus || undefined,
        page: 1,
        limit: EXPORT_FETCH_LIMIT,
    });

    const items = result.items ?? [];

    const rows: InventoryExportRow[] = items.map((item) => ({
        productName: item.product.name,
        barcode: item.product.barcode,
        category: item.product.category,
        quantity: item.quantity,
        status: STOCK_LABEL[getStockKey(item)],
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

    const totalProducts = items.length;
    const lowStock = items.filter(
        (i) => i.quantity > 0 && i.quantity <= i.lowStockThreshold,
    ).length;
    const outOfStock = items.filter((i) => i.quantity === 0).length;
    const totalStockValue = items.reduce(
        (acc, i) => acc + Number(i.quantity) * Number(i.product.costPrice),
        0,
    );

    const parts: string[] = [];
    if (filters.category) parts.push(`Category: ${filters.category}`);
    if (filters.stockStatus)
        parts.push(`Status: ${STOCK_LABEL[filters.stockStatus]}`);
    if (filters.search) parts.push(`Search: "${filters.search}"`);
    const subtitle = parts.length > 0 ? parts.join('  ·  ') : 'All products';

    await exportData(format, rows, columns, {
        title: 'Inventory Report',
        subtitle,
        filenameBase: 'inventory',
        companyName: 'LedgerPro',
        generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
        summary: [
            { label: 'Total Products', value: String(totalProducts) },
            { label: 'Low Stock', value: String(lowStock) },
            { label: 'Out of Stock', value: String(outOfStock) },
            { label: 'Total Stock Value', value: formatCurrency(totalStockValue) },
        ],
    });
}
