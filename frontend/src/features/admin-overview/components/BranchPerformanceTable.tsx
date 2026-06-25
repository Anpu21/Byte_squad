import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IOverviewResponse } from '@/types';

type BranchRow = IOverviewResponse['branches'][number];

interface BranchPerformanceTableProps {
    branches: IOverviewResponse['branches'];
}

const columns: DataTableColumn<BranchRow>[] = [
    {
        key: 'branch',
        header: 'Branch',
        render: (b) => (
            <div className="flex flex-col">
                <span className="text-text-1 font-medium">{b.branchName}</span>
                <span className="text-[11px] text-text-3">
                    {b.managerName || 'No manager'}
                </span>
            </div>
        ),
    },
    {
        key: 'sales',
        header: "Today's Sales",
        className: 'text-text-1 font-medium',
        render: (b) => formatCurrency(b.todaySales),
    },
    {
        key: 'txns',
        header: 'Txns',
        className: 'text-text-1',
        render: (b) => b.todayTransactions,
    },
    {
        key: 'staff',
        header: 'Staff',
        className: 'text-text-1',
        render: (b) => b.staffCount,
    },
    {
        key: 'active',
        header: 'Active Products',
        className: 'text-text-1',
        render: (b) => b.activeProducts,
    },
    {
        key: 'low',
        header: 'Low Stock',
        render: (b) => (
            <span
                className={
                    b.lowStockItems > 0
                        ? 'text-danger font-medium'
                        : 'text-text-3'
                }
            >
                {b.lowStockItems}
            </span>
        ),
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
];

export function BranchPerformanceTable({ branches }: BranchPerformanceTableProps) {
    return (
        <div className="bg-surface border border-border rounded-md mb-6 overflow-hidden">
            <div className="p-5 border-b border-border">
                <h2 className="text-sm font-bold text-text-1 uppercase tracking-widest">
                    Branch Performance
                </h2>
            </div>
            <DataTable
                columns={columns}
                rows={branches}
                getRowKey={(b) => b.branchId}
                empty={<EmptyState title="No branches yet" />}
            />
        </div>
    );
}
