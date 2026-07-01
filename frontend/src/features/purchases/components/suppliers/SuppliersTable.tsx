import {
    Button,
    DataTable,
    EmptyState,
    Pill,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { ISupplier } from '@/types';

interface ISuppliersTableProps {
    rows: ISupplier[];
    isLoading: boolean;
    onEdit: (supplier: ISupplier) => void;
}

/** Supplier master list — read view with an Edit action per row. */
export function SuppliersTable({ rows, isLoading, onEdit }: ISuppliersTableProps) {
    const columns: DataTableColumn<ISupplier>[] = [
        {
            key: 'name',
            header: 'Supplier',
            className: 'font-medium',
            render: (s) => s.name,
        },
        {
            key: 'contact',
            header: 'Contact',
            className: 'text-text-2',
            render: (s) => s.contactName ?? '—',
        },
        {
            key: 'phone',
            header: 'Phone',
            className: 'text-text-2',
            render: (s) => s.phone ?? '—',
        },
        {
            key: 'terms',
            header: 'Terms',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (s) => `${s.creditTermDays}d`,
        },
        {
            key: 'opening',
            header: 'Opening balance',
            align: 'right',
            numeric: true,
            render: (s) => formatCurrency(Number(s.openingBalance)),
        },
        {
            key: 'status',
            header: 'Status',
            render: (s) => (
                <Pill tone={s.status === 'Active' ? 'success' : 'neutral'}>
                    {s.status}
                </Pill>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (s) => (
                <Button size="sm" variant="secondary" onClick={() => onEdit(s)}>
                    Edit
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(s) => s.id}
            isLoading={isLoading}
            zebra
            clientPaginate={{ unit: 'suppliers' }}
            empty={
                <EmptyState
                    title="No suppliers yet"
                    description="Add your first supplier to start receiving goods against them."
                />
            }
        />
    );
}
