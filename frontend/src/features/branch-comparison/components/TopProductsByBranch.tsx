import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { IBranchAnalyticsComparisonEntry } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

type TopProduct =
    IBranchAnalyticsComparisonEntry['sales']['topProducts'][number];

interface TopProductsByBranchProps {
    entry: IBranchAnalyticsComparisonEntry;
}

export function TopProductsByBranch({ entry }: TopProductsByBranchProps) {
    const columns: DataTableColumn<TopProduct>[] = [
        {
            key: 'product',
            header: 'Product',
            className: 'font-medium',
            render: (p) => p.productName,
        },
        {
            key: 'quantity',
            header: 'Qty',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (p) => p.quantity.toLocaleString(),
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

    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
                <p className="text-[13px] font-semibold text-text-1">
                    Top products — {entry.branchName}
                </p>
            </div>
            <DataTable
                columns={columns}
                rows={entry.sales.topProducts}
                getRowKey={(p) => p.productId}
                zebra
                empty={<EmptyState title="No sales in this range" />}
            />
        </Card>
    );
}
