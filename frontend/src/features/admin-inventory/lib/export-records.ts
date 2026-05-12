import { adminService } from '@/services/admin.service';
import { formatCurrency } from '@/lib/utils';
import {
    exportData,
    type ExportColumn,
    type ExportFormat,
} from '@/lib/exportUtils';
import type { StockKey } from '../types/stock-key.type';
import { STOCK_LABEL } from '../constants';
import { getStockKey } from './stock-key';

interface AdminInventoryExportRow {
    productName: string;
    barcode: string;
    category: string;
    branch: string;
    quantity: number;
    status: string;
    sellingPrice: number;
}

interface ExportArgs {
    filters: {
        search: string;
        category: string;
        branchId: string;
        branchName: string;
        stockStatus: '' | StockKey;
    };
    user: { firstName: string; lastName: string } | null;
    format: ExportFormat;
}

const EXPORT_FETCH_LIMIT = 10000;

export async function exportInventoryRecords({
    filters,
    user,
    format,
}: ExportArgs): Promise<void> {
    const lowStockOnly =
        filters.stockStatus === 'low_stock' ||
        filters.stockStatus === 'out_of_stock';

    const result = await adminService.getInventoryMatrix({
        search: filters.search || undefined,
        category: filters.category || undefined,
        lowStockOnly: lowStockOnly || undefined,
        page: 1,
        limit: EXPORT_FETCH_LIMIT,
    });

    const branchById = new Map(
        (result?.branches ?? []).map((b) => [b.id, b]),
    );

    const flat: AdminInventoryExportRow[] = [];
    let totalLow = 0;
    let totalOut = 0;
    let totalStockValue = 0;
    for (const row of result?.rows ?? []) {
        for (const cell of row.cells) {
            if (cell.inventoryId === null) continue;
            const branch = branchById.get(cell.branchId);
            if (!branch) continue;
            if (filters.branchId && branch.id !== filters.branchId) continue;
            const stockKey = getStockKey(cell);
            if (filters.stockStatus && stockKey !== filters.stockStatus) continue;
            if (stockKey === 'low_stock') totalLow++;
            if (stockKey === 'out_of_stock') totalOut++;
            totalStockValue += Number(cell.quantity) * Number(row.sellingPrice);
            flat.push({
                productName: row.productName,
                barcode: row.barcode,
                category: row.category,
                branch: branch.name,
                quantity: cell.quantity,
                status: STOCK_LABEL[stockKey],
                sellingPrice: Number(row.sellingPrice),
            });
        }
    }

    const columns: ExportColumn<AdminInventoryExportRow>[] = [
        { header: 'Product Name', key: 'productName' },
        { header: 'Barcode', key: 'barcode' },
        { header: 'Category', key: 'category' },
        { header: 'Branch', key: 'branch' },
        { header: 'Stock', key: 'quantity', align: 'right' },
        { header: 'Status', key: 'status' },
        {
            header: 'Selling Price',
            key: 'sellingPrice',
            align: 'right',
            format: 'currency',
        },
    ];

    const parts: string[] = [];
    if (filters.branchId && filters.branchName)
        parts.push(`Branch: ${filters.branchName}`);
    if (filters.category) parts.push(`Category: ${filters.category}`);
    if (filters.stockStatus)
        parts.push(`Status: ${STOCK_LABEL[filters.stockStatus]}`);
    if (filters.search) parts.push(`Search: "${filters.search}"`);
    const subtitle =
        parts.length > 0 ? parts.join('  ·  ') : 'All branches · all products';

    await exportData(format, flat, columns, {
        title: 'Admin Inventory Report',
        subtitle,
        filenameBase: 'admin-inventory',
        companyName: 'LedgerPro',
        generatedBy: user ? `${user.firstName} ${user.lastName}` : undefined,
        summary: [
            { label: 'Total Records', value: String(flat.length) },
            { label: 'Low Stock', value: String(totalLow) },
            { label: 'Out of Stock', value: String(totalOut) },
            { label: 'Total Stock Value', value: formatCurrency(totalStockValue) },
        ],
    });
}
