import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IReceivableRow } from '@/types';

interface IReceivablesTableProps {
    rows: IReceivableRow[];
    isLoading: boolean;
    onOpenStatement: (row: IReceivableRow) => void;
}

/** Customers with live balances / unpaid credit sales, aged by sale date. */
export function ReceivablesTable({
    rows,
    isLoading,
    onOpenStatement,
}: IReceivablesTableProps) {
    const columns: DataTableColumn<IReceivableRow>[] = [
        {
            key: 'customer',
            header: 'Customer',
            className: 'font-medium',
            render: (r) => `${r.firstName} ${r.lastName}`,
        },
        {
            key: 'phone',
            header: 'Phone',
            className: 'text-text-2',
            render: (r) => r.phone ?? '—',
        },
        {
            key: 'balance',
            header: 'Balance',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (r) => (
                <span
                    className={
                        r.currentBalance > 0
                            ? 'text-danger'
                            : r.currentBalance < 0
                              ? 'text-accent-text'
                              : 'text-text-2'
                    }
                >
                    {formatCurrency(r.currentBalance)}
                </span>
            ),
        },
        {
            key: 'limit',
            header: 'Limit',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (r) =>
                r.creditLimit === null ? '∞' : formatCurrency(r.creditLimit),
        },
        {
            key: 'b0',
            header: '0–30d',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (r) => formatCurrency(r.b0to30),
        },
        {
            key: 'b31',
            header: '31–60d',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (r) => formatCurrency(r.b31to60),
        },
        {
            key: 'b61',
            header: '61–90d',
            align: 'right',
            numeric: true,
            className: 'text-warning',
            render: (r) => formatCurrency(r.b61to90),
        },
        {
            key: 'b90',
            header: '90d+',
            align: 'right',
            numeric: true,
            className: 'text-danger',
            render: (r) => formatCurrency(r.b90plus),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (r) => (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenStatement(r)}
                >
                    Statement
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.userId}
            isLoading={isLoading}
            zebra
            clientPaginate={{ unit: 'customers' }}
            empty={
                <EmptyState
                    title="No receivables"
                    description="No customer owes anything right now — credit sales will appear here with ageing buckets."
                />
            }
        />
    );
}
