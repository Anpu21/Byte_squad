import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { formatRevenue, formatTime } from '@/features/admin-dashboard/lib/format';
import type { ISale } from '@/types';

interface CashierRecentTransactionsProps {
    transactions: ISale[];
}

const columns: DataTableColumn<ISale>[] = [
    {
        key: 'txn',
        header: 'Tx #',
        numeric: true,
        className: 'text-xs',
        render: (txn) => txn.transactionNumber,
    },
    {
        key: 'time',
        header: 'Time',
        className: 'mono text-xs text-text-2',
        render: (txn) => formatTime(txn.createdAt),
    },
    {
        key: 'items',
        header: 'Items',
        className: 'text-text-2',
        render: (txn) =>
            (txn as ISale & { items?: unknown[] }).items?.length ?? '—',
    },
    {
        key: 'total',
        header: 'Total',
        align: 'right',
        numeric: true,
        className: 'font-semibold',
        render: (txn) => formatRevenue(Number(txn.total)),
    },
    {
        key: 'status',
        header: 'Status',
        render: () => <Pill tone="success">Completed</Pill>,
    },
];

export function CashierRecentTransactions({
    transactions,
}: CashierRecentTransactionsProps) {
    return (
        <Card>
            <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-1">
                    Recent transactions
                </h3>
            </div>
            <DataTable
                columns={columns}
                rows={transactions}
                getRowKey={(txn) => txn.id}
                zebra
                stickyHeader
                maxHeight="320px"
                empty={<EmptyState title="No transactions yet today" />}
            />
        </Card>
    );
}
