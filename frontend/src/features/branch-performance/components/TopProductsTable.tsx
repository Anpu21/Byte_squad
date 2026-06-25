import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

type TopProduct = IMyBranchPerformance['topProducts'][number];

interface TopProductsTableProps {
    topProducts: IMyBranchPerformance['topProducts'];
}

const columns: DataTableColumn<TopProduct>[] = [
    {
        key: 'product',
        header: 'Product',
        className: 'font-medium',
        render: (p) => p.name,
    },
    {
        key: 'qty',
        header: 'Qty',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (p) => p.quantity,
    },
    {
        key: 'revenue',
        header: 'Revenue',
        align: 'right',
        numeric: true,
        className: 'font-semibold',
        render: (p) => formatCurrencyWhole(p.revenue),
    },
];

export function TopProductsTable({ topProducts }: TopProductsTableProps) {
    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Top products
                </h3>
                <p className="text-xs text-text-2 mt-0.5">Last 30 days</p>
            </div>
            <DataTable
                columns={columns}
                rows={topProducts}
                getRowKey={(p) => p.productId}
                empty={<EmptyState title="No sales data yet" />}
            />
        </Card>
    );
}
