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
    /** Show the "who processed it" column (hidden for cashiers — all theirs). */
    showCashier?: boolean;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function cashierName(r: ISalesReturn): string {
    if (!r.createdBy) return '—';
    return `${r.createdBy.firstName} ${r.createdBy.lastName}`.trim() || '—';
}

const statusColumn: DataTableColumn<ISalesReturn> = {
    key: 'status',
    header: 'Status',
    render: (r) => (
        <span className="inline-flex items-center h-5 px-2 rounded-md text-[11.5px] font-medium bg-accent-soft text-accent-text">
            {r.status}
        </span>
    ),
};

const cashierColumn: DataTableColumn<ISalesReturn> = {
    key: 'cashier',
    header: 'Processed by',
    className: 'text-text-2 whitespace-nowrap',
    render: cashierName,
};

function buildColumns(showCashier: boolean): DataTableColumn<ISalesReturn>[] {
    return [
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
        ...(showCashier ? [cashierColumn] : []),
        {
            key: 'lines',
            header: 'Lines',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (r) => r.items?.length ?? '—',
        },
        statusColumn,
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
}

export function ReturnsTable({
    rows,
    isLoading,
    showCashier = true,
}: ReturnsTableProps) {
    return (
        <DataTable
            columns={buildColumns(showCashier)}
            rows={rows}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            zebra
            empty={
                <EmptyState
                    icon={<Undo2 size={20} />}
                    title="No returns yet"
                    description="Returns you process appear here."
                />
            }
        />
    );
}
