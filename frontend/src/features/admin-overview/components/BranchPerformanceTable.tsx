import { formatCurrency } from '@/lib/utils';
import type { IOverviewResponse } from '@/types';

interface BranchPerformanceTableProps {
    branches: IOverviewResponse['branches'];
}

const HEADERS = [
    'Branch',
    "Today's Sales",
    'Txns',
    'Staff',
    'Active Products',
    'Low Stock',
    'Status',
];

export function BranchPerformanceTable({
    branches,
}: BranchPerformanceTableProps) {
    return (
        <div className="bg-surface border border-border rounded-md mb-6 overflow-hidden">
            <div className="p-5 border-b border-border">
                <h2 className="text-sm font-bold text-text-1 uppercase tracking-widest">
                    Branch Performance
                </h2>
            </div>
            <div className="overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-widest text-text-3 border-b border-border">
                            {HEADERS.map((h) => (
                                <th key={h} className="px-5 py-3 font-semibold">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {branches.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={HEADERS.length}
                                    className="px-5 py-12 text-center text-text-3"
                                >
                                    No branches yet
                                </td>
                            </tr>
                        ) : (
                            branches.map((b) => (
                                <tr
                                    key={b.branchId}
                                    className="border-b border-border hover:bg-surface-2"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-text-1 font-medium">
                                                {b.branchName}
                                            </span>
                                            <span className="text-[11px] text-text-3">
                                                {b.adminName || 'No admin'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-text-1 font-medium">
                                        {formatCurrency(b.todaySales)}
                                    </td>
                                    <td className="px-5 py-3 text-text-1">
                                        {b.todayTransactions}
                                    </td>
                                    <td className="px-5 py-3 text-text-1">
                                        {b.staffCount}
                                    </td>
                                    <td className="px-5 py-3 text-text-1">
                                        {b.activeProducts}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span
                                            className={
                                                b.lowStockItems > 0
                                                    ? 'text-danger font-medium'
                                                    : 'text-text-3'
                                            }
                                        >
                                            {b.lowStockItems}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        {b.isActive ? (
                                            <span className="inline-flex items-center gap-1.5 text-text-1 text-[13px]">
                                                <span className="w-2 h-2 rounded-full bg-primary" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-text-3 text-[13px]">
                                                <span className="w-2 h-2 rounded-full bg-text-3" />
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
