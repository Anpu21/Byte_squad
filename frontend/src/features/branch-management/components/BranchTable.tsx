import type { IBranchWithMeta } from '@/types';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';

interface BranchTableProps {
    branches: IBranchWithMeta[];
    isLoading: boolean;
    onEdit: (branch: IBranchWithMeta) => void;
    onToggle: (id: string) => void;
    onDelete: (branch: IBranchWithMeta) => void;
}

export function BranchTable({
    branches,
    isLoading,
    onEdit,
    onToggle,
    onDelete,
}: BranchTableProps) {
    const columns: DataTableColumn<IBranchWithMeta>[] = [
        {
            key: 'code',
            header: 'Code',
            render: (b) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-semibold bg-surface-2 text-text-2 border border-border">
                    {b.code}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Name',
            className: 'text-text-1 font-medium',
            render: (b) => b.name,
        },
        {
            key: 'address',
            header: 'Address',
            className: 'text-text-2',
            render: (b) => (
                <div className="flex flex-col">
                    <span>{b.addressLine1}</span>
                    {(b.city || b.country) && (
                        <span className="text-[11px] text-text-3">
                            {[b.city, b.country].filter(Boolean).join(', ')}
                        </span>
                    )}
                </div>
            ),
        },
        {
            key: 'phone',
            header: 'Phone',
            className: 'text-text-2',
            render: (b) => b.phone || '—',
        },
        {
            key: 'manager',
            header: 'Manager',
            render: (b) =>
                b.managerName ? (
                    <div className="flex flex-col">
                        <span className="text-text-1">{b.managerName}</span>
                        <span className="text-[11px] text-text-3">
                            {b.managerEmail}
                        </span>
                    </div>
                ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-bold bg-warning-soft text-warning border border-warning/40 uppercase tracking-widest">
                        No manager
                    </span>
                ),
        },
        {
            key: 'staff',
            header: 'Staff',
            className: 'text-text-1 tabular-nums',
            render: (b) => b.staffCount,
        },
        {
            key: 'status',
            header: 'Status',
            render: (b) =>
                b.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-text-1 text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        Active
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-text-3 text-[13px]">
                        <span className="w-2 h-2 rounded-full bg-text-3" />
                        Inactive
                    </span>
                ),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (b) => (
                <div className="space-x-2 whitespace-nowrap">
                    <button
                        type="button"
                        onClick={() => onEdit(b)}
                        className="text-xs text-text-1 hover:underline"
                    >
                        Edit
                    </button>
                    <button
                        type="button"
                        onClick={() => onToggle(b.id)}
                        className="text-xs text-text-1 hover:underline"
                    >
                        {b.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(b)}
                        className="text-xs text-danger hover:underline"
                    >
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
            <DataTable
                columns={columns}
                rows={branches}
                getRowKey={(b) => b.id}
                isLoading={isLoading}
                zebra
                empty={<EmptyState title="No branches yet" />}
            />
        </div>
    );
}
