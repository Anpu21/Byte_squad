import { useNavigate } from 'react-router-dom';
import { ImageIcon, Package, Pencil } from 'lucide-react';
import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    StatusPill,
    type DataTableColumn,
} from '@/components/ui';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import { formatStockQuantity } from '@/features/inventory-list/lib/format-stock-quantity';
import type { FlatRecord } from '../types/flat-record.type';

interface InventoryRecordTableProps {
    records: FlatRecord[];
    isLoading: boolean;
    hasActiveFilter: boolean;
    onResetFilters: () => void;
}

export function InventoryRecordTable({
    records,
    isLoading,
    hasActiveFilter,
    onResetFilters,
}: InventoryRecordTableProps) {
    const navigate = useNavigate();

    const columns: DataTableColumn<FlatRecord>[] = [
        {
            key: 'product',
            header: 'Product',
            render: (rec) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md bg-surface-2 border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ImageIcon size={16} className="text-text-3" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm text-text-1 font-medium truncate">
                            {rec.row.productName}
                        </p>
                        <p className="text-[11px] text-text-3 mono mt-0.5 truncate">
                            {rec.row.barcode}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            render: (rec) => (
                <Pill tone="neutral" dot={false}>
                    {rec.row.category}
                </Pill>
            ),
        },
        {
            key: 'branch',
            header: 'Branch',
            render: (rec) => (
                <Pill tone="info" dot={false}>
                    {rec.branch.name}
                </Pill>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (rec) => <StatusPill status={rec.stockKey} />,
        },
        {
            key: 'quantity',
            header: 'Quantity',
            align: 'right',
            render: (rec) => (
                <span
                    className={`mono text-sm font-semibold ${
                        rec.cell.quantity === 0 ? 'text-text-3' : 'text-text-1'
                    }`}
                >
                    {formatStockQuantity(rec.cell.quantity, rec.row.baseUnit)}
                </span>
            ),
        },
        {
            key: 'price',
            header: 'Price',
            align: 'right',
            render: (rec) => (
                <span className="mono text-[12px] text-text-2">
                    {formatCurrency(Number(rec.row.sellingPrice))}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (rec) => (
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            FRONTEND_ROUTES.INVENTORY_EDIT.replace(
                                ':productId',
                                rec.row.productId,
                            ),
                        )
                    }
                    className="p-1.5 text-text-3 hover:text-text-1 rounded-md hover:bg-surface-2 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    title="Edit product"
                    aria-label="Edit product"
                >
                    <Pencil size={14} />
                </button>
            ),
        },
    ];

    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            <DataTable
                columns={columns}
                rows={records}
                getRowKey={(rec) => rec.key}
                isLoading={isLoading}
                zebra
                rowClassName="group"
                empty={
                    <EmptyState
                        icon={<Package size={20} />}
                        title="No inventory records found"
                        description={
                            hasActiveFilter
                                ? 'No records match the current filters.'
                                : 'No products in the catalog yet.'
                        }
                        action={
                            hasActiveFilter ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={onResetFilters}
                                    size="md"
                                >
                                    Reset filters
                                </Button>
                            ) : undefined
                        }
                    />
                }
            />
        </div>
    );
}
