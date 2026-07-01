import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { ICashierTransactionsSummary } from '@/types';
import { formatDateTime, formatRevenue } from '../lib/format';

type Txn = ICashierTransactionsSummary['recentTransactions'][number];

interface TransactionsTableProps {
    data: ICashierTransactionsSummary;
    showBranchCol: boolean;
    showCashierCol: boolean;
}

function describeScope(scope: ICashierTransactionsSummary['scope']): string {
    if (scope === 'system') return ' across all branches';
    if (scope === 'branch') return ' across the branch';
    return '';
}

export function TransactionsTable({
    data,
    showBranchCol,
    showCashierCol,
}: TransactionsTableProps) {
    const count = data.recentTransactions.length;

    const columns: DataTableColumn<Txn>[] = [
        {
            key: 'txn',
            header: 'Transaction #',
            numeric: true,
            className: 'text-xs',
            render: (t) => t.transactionNumber,
        },
        {
            key: 'datetime',
            header: 'Date / Time',
            className: 'mono text-xs text-text-2',
            render: (t) => formatDateTime(t.createdAt),
        },
        ...(showBranchCol
            ? [
                  {
                      key: 'branch',
                      header: 'Branch',
                      render: (t: Txn) => t.branchName ?? '—',
                  } satisfies DataTableColumn<Txn>,
              ]
            : []),
        ...(showCashierCol
            ? [
                  {
                      key: 'cashier',
                      header: 'Cashier',
                      className: 'text-text-2',
                      render: (t: Txn) => t.cashierName,
                  } satisfies DataTableColumn<Txn>,
              ]
            : []),
        {
            key: 'items',
            header: 'Items',
            align: 'right',
            numeric: true,
            render: (t) => t.itemCount,
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (t) => formatRevenue(Number(t.total)),
        },
    ];

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>All transactions</CardTitle>
                    <p className="text-xs text-text-2 mt-0.5">
                        {count} {count === 1 ? 'transaction' : 'transactions'}
                        {describeScope(data.scope)}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <DataTable
                    columns={columns}
                    rows={data.recentTransactions}
                    getRowKey={(t) => t.id}
                    zebra
                    stickyHeader
                    maxHeight="600px"
                    clientPaginate={{ unit: 'transactions' }}
                    empty={<EmptyState title="No transactions yet" />}
                />
            </CardContent>
        </Card>
    );
}
