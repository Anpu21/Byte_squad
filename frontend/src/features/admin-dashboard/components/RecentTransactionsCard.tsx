import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    Pill,
    StatusPill,
    type DataTableColumn,
} from '@/components/ui';
import type { ISale } from '@/types';
import { formatRevenue } from '../lib/format';

type RecentTransaction = ISale & {
    branch?: { name: string };
};

interface RecentTransactionsCardProps {
    transactions: RecentTransaction[];
}

function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function titleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Recent sales table. Columns mirror the design (Invoice / Date / Customer /
 * Branch / Amount / Payment / Status); the branch name comes from the
 * eager-loaded `branch` relation, and the payment status renders through
 * StatusPill (Paid → success, Unpaid → danger, Partial → warning).
 */
export function RecentTransactionsCard({
    transactions,
}: RecentTransactionsCardProps) {
    const columns: DataTableColumn<RecentTransaction>[] = [
        {
            key: 'invoice',
            header: 'Invoice #',
            numeric: true,
            className: 'mono text-xs text-primary font-semibold whitespace-nowrap',
            render: (t) => t.invoiceNumber,
        },
        {
            key: 'date',
            header: 'Date',
            className: 'text-xs text-text-3 whitespace-nowrap',
            render: (t) => formatDateTime(t.createdAt),
        },
        {
            key: 'customer',
            header: 'Customer',
            className: 'text-text-1',
            render: (t) =>
                t.customer
                    ? `${t.customer.firstName} ${t.customer.lastName}`
                    : 'Walk-in Customer',
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (t) => t.branch?.name ?? '—',
        },
        {
            key: 'amount',
            header: 'Amount',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (t) => formatRevenue(Number(t.total)),
        },
        {
            key: 'method',
            header: 'Payment',
            render: (t) => (
                <Pill tone="neutral" dot={false}>
                    {titleCase(t.paymentMethod)}
                </Pill>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            render: (t) => <StatusPill status={t.paymentStatus} />,
        },
    ];

    return (
        <Card>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                    Recent Transactions
                </h3>
            </div>
            <DataTable
                columns={columns}
                rows={transactions}
                getRowKey={(t) => t.id}
                zebra
                stickyHeader
                maxHeight="420px"
                empty={<EmptyState title="No transactions yet" />}
            />
        </Card>
    );
}
