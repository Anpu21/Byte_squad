import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IGrn } from '@/types';
import { GrnPaymentPill } from './GrnPaymentPill';

interface IGrnsTableProps {
    rows: IGrn[];
    isLoading: boolean;
    onView: (grn: IGrn) => void;
}

/** GRN register — goods receipts with bill/payment state at a glance. */
export function GrnsTable({ rows, isLoading, onView }: IGrnsTableProps) {
    const columns: DataTableColumn<IGrn>[] = [
        {
            key: 'grn',
            header: 'GRN #',
            numeric: true,
            className: 'font-medium',
            render: (g) => g.grnNumber,
        },
        {
            key: 'date',
            header: 'Date',
            className: 'text-text-2 whitespace-nowrap',
            render: (g) => g.grnDate,
        },
        {
            key: 'supplier',
            header: 'Supplier',
            render: (g) => g.supplier?.name ?? '—',
        },
        {
            key: 'branch',
            header: 'Branch',
            className: 'text-text-2',
            render: (g) => g.branch?.name ?? '—',
        },
        {
            key: 'total',
            header: 'Total',
            align: 'right',
            numeric: true,
            render: (g) => formatCurrency(Number(g.grandTotal)),
        },
        {
            key: 'paid',
            header: 'Paid',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (g) => formatCurrency(Number(g.paidAmount)),
        },
        {
            key: 'payment',
            header: 'Payment',
            render: (g) => <GrnPaymentPill status={g.paymentStatus} />,
        },
        {
            key: 'status',
            header: 'Status',
            render: (g) => (
                <Pill tone={g.status === 'Received' ? 'info' : 'neutral'}>
                    {g.status}
                </Pill>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (g) => (
                <Button size="sm" variant="secondary" onClick={() => onView(g)}>
                    View
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(g) => g.id}
            isLoading={isLoading}
            zebra
            clientPaginate={{ unit: 'GRNs' }}
            empty={
                <EmptyState
                    title="No goods receipts yet"
                    description="Receive your first delivery from the New GRN tab — stock, cost, and the supplier bill are recorded in one step."
                />
            }
        />
    );
}
