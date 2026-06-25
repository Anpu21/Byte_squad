import { LuUndo2 as Undo2 } from 'react-icons/lu';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ISalesReturn } from '@/types';

interface ReturnsTableProps {
    rows: ISalesReturn[];
    isLoading: boolean;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

const columns: DataTableColumn<ISalesReturn>[] = [
    {
        key: 'date',
        header: 'Date',
        className: 'text-text-2 whitespace-nowrap',
        render: (r) => formatDate(r.createdAt),
    },
    {
        key: 'invoice',
        header: 'Invoice',
        className: 'font-medium',
        render: (r) => r.invoiceNumber,
    },
    {
        key: 'branch',
        header: 'Branch',
        className: 'text-text-2',
        render: (r) => r.branch?.name ?? '—',
    },
    {
        key: 'lines',
        header: 'Lines',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => r.items?.length ?? '—',
    },
    {
        key: 'restocked',
        header: 'Restocked',
        align: 'right',
        numeric: true,
        className: 'text-text-2',
        render: (r) => formatCurrency(Number(r.restockedValue)),
    },
    {
        key: 'refund',
        header: 'Refund',
        align: 'right',
        numeric: true,
        className: 'text-danger',
        render: (r) => formatCurrency(Number(r.totalRefundAmount)),
    },
];

export function ReturnsTable({ rows, isLoading }: ReturnsTableProps) {
    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    icon={<Undo2 size={20} />}
                    title="No returns yet"
                    description="Process a return by looking up a sale invoice."
                />
            }
        />
    );
}
