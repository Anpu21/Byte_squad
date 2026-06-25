import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import type { ISale } from '@/types';
import { formatRevenue, formatTime } from '../lib/format';

type TransactionWithCashier = ISale & {
    cashier?: { firstName: string; lastName: string };
};

interface RecentActivityCardProps {
    transactions: TransactionWithCashier[];
}

export function RecentActivityCard({ transactions }: RecentActivityCardProps) {
    const columns: DataTableColumn<TransactionWithCashier>[] = [
        {
            key: 'transaction',
            header: 'Transaction',
            numeric: true,
            className: 'text-xs',
            render: (txn) => txn.transactionNumber,
        },
        {
            key: 'cashier',
            header: 'Cashier',
            className: 'text-text-2',
            render: (txn) =>
                txn.cashier
                    ? `${txn.cashier.firstName} ${txn.cashier.lastName}`
                    : '—',
        },
        {
            key: 'time',
            header: 'Time',
            className: 'mono text-xs text-text-2',
            render: (txn) => formatTime(txn.createdAt),
        },
        {
            key: 'method',
            header: 'Method',
            render: (txn) => (
                <Pill tone="neutral" dot={false}>
                    {txn.paymentMethod}
                </Pill>
            ),
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (txn) => formatRevenue(Number(txn.total)),
        },
    ];

    return (
        <Card>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                    <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                        Recent activity
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        Latest sales across all branches
                    </p>
                </div>
            </div>
            <DataTable
                columns={columns}
                rows={transactions}
                getRowKey={(txn) => txn.id}
                zebra
                stickyHeader
                maxHeight="420px"
                empty={<EmptyState title="No transactions yet" />}
            />
        </Card>
    );
}
