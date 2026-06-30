import { useState } from 'react';
import { LuStar as Star } from 'react-icons/lu';
import DataTable, {
    type DataTableColumn,
    type SortState,
} from '@/components/ui/DataTable';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrencyWhole } from '../lib/format';
import type { ProductBranchRow } from './top-products-data';

interface TopProductsTableProps {
    rows: ProductBranchRow[];
}

function sortRows(
    rows: ProductBranchRow[],
    sort: SortState,
): ProductBranchRow[] {
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        switch (sort.key) {
            case 'product':
                return a.productName.localeCompare(b.productName) * dir;
            case 'branch':
                return a.branchName.localeCompare(b.branchName) * dir;
            case 'revenue':
                return (a.revenue - b.revenue) * dir;
            case 'qty':
                return (a.quantity - b.quantity) * dir;
            default:
                return 0;
        }
    });
}

/**
 * Flat "top products by branch" table — one row per product × branch, sortable,
 * with the leader (best-selling) branch row badged. Replaces the per-product
 * card grid. Default order is the incoming grouping (product by total revenue,
 * leader first); clicking a header sorts the flat list.
 */
export function TopProductsTable({ rows }: TopProductsTableProps) {
    const [sort, setSort] = useState<SortState | undefined>(undefined);
    const sorted = sort ? sortRows(rows, sort) : rows;

    const columns: DataTableColumn<ProductBranchRow>[] = [
        {
            key: 'product',
            header: 'Product',
            sortable: true,
            className: 'font-medium text-text-1',
            render: (row) => row.productName,
        },
        {
            key: 'branch',
            header: 'Branch',
            sortable: true,
            render: (row) => (
                <span className="inline-flex items-center gap-2">
                    <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                    />
                    <span
                        className={
                            row.isLeader
                                ? 'font-semibold text-text-1'
                                : 'text-text-2'
                        }
                    >
                        {row.branchName}
                    </span>
                </span>
            ),
        },
        {
            key: 'revenue',
            header: 'Revenue',
            align: 'right',
            numeric: true,
            sortable: true,
            render: (row) => formatCurrencyWhole(row.revenue),
        },
        {
            key: 'qty',
            header: 'Qty',
            align: 'right',
            numeric: true,
            sortable: true,
            render: (row) => row.quantity.toLocaleString(),
        },
        {
            key: 'leader',
            header: 'Leader',
            align: 'center',
            render: (row) =>
                row.isLeader ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-text">
                        <Star size={10} fill="currentColor" aria-hidden="true" />
                        Leader
                    </span>
                ) : null,
        },
    ];

    return (
        <DataTable<ProductBranchRow>
            columns={columns}
            rows={sorted}
            getRowKey={(row) => `${row.productId}:${row.branchId}`}
            sort={sort}
            onSortChange={setSort}
            stickyHeader
            zebra
            empty={<EmptyState title="No sales in this range" />}
        />
    );
}
