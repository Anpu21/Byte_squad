import Card from '@/components/ui/Card';
import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole, formatDateTime } from '../lib/format';

type Txn = IMyBranchPerformance['recentTransactions'][number];

interface RecentTransactionsTableProps {
    recentTransactions: IMyBranchPerformance['recentTransactions'];
}

export function RecentTransactionsTable({
    recentTransactions,
}: RecentTransactionsTableProps) {
    const columns: DataTableColumn<Txn>[] = [
        {
            key: 'txn',
            header: 'Tx#',
            className: 'mono text-xs tabular-nums',
            render: (t) => t.transactionNumber,
        },
        {
            key: 'cashier',
            header: 'Cashier',
            className: 'text-text-2',
            render: (t) => t.cashierName,
        },
        {
            key: 'when',
            header: 'When',
            className: 'mono text-xs text-text-3',
            render: (t) => formatDateTime(t.createdAt),
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (t) => formatCurrencyWhole(t.total),
        },
    ];

    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Recent transactions
                </h3>
                <p className="text-xs text-text-2 mt-0.5">
                    Latest at this branch
                </p>
            </div>
            <DataTable
                columns={columns}
                rows={recentTransactions}
                getRowKey={(t) => t.id}
                zebra
                empty={<EmptyState title="No transactions yet" />}
            />
        </Card>
    );
}
