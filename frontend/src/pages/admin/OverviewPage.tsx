import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import type { IOverviewResponse, IOverviewAlert } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
    }).format(amount);
}

function alertTone(type: IOverviewAlert['type']): string {
    switch (type) {
        case 'critical_low_stock':
            return 'text-danger border-danger/40 bg-red-500/5';
        case 'no_admin':
            return 'text-warning border-warning/40 bg-amber-500/5';
        case 'no_transactions':
            return 'text-info border-info/40 bg-sky-500/5';
        case 'inactive_branch':
            return 'text-text-2 border-slate-500/30 bg-slate-500/5';
    }
}

interface OverviewPageProps {
    embedded?: boolean;
}

export default function OverviewPage({ embedded = false }: OverviewPageProps = {}) {
    const { data, isLoading } = useQuery<IOverviewResponse>({
        queryKey: ['admin-overview'],
        queryFn: adminService.getOverview,
        refetchInterval: 30000,
    });

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const { summary, branches, alerts } = data;

    const cards = [
        {
            title: "Today's Revenue",
            value: formatCurrency(summary.totalRevenueToday),
            sub: `${summary.totalTransactionsToday} transactions`,
        },
        {
            title: 'Total Transactions',
            value: String(summary.totalTransactionsToday),
            sub: 'Today',
        },
        {
            title: 'Branches',
            value: String(summary.activeBranches + summary.inactiveBranches),
            sub: `${summary.activeBranches} active, ${summary.inactiveBranches} inactive`,
        },
        {
            title: 'Total Staff',
            value: String(summary.totalStaff),
            sub: 'Across all branches',
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!embedded && (
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            System Overview
                        </h1>
                        <p className="text-sm text-text-2 mt-1">
                            All branches at a glance
                        </p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-surface border border-border rounded-md p-5"
                    >
                        <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold mb-2">
                            {card.title}
                        </p>
                        <p className="text-2xl font-bold text-text-1 tracking-tight">
                            {card.value}
                        </p>
                        <p className="text-xs text-text-3 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Branch Performance Table */}
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
                                <th className="px-5 py-3 font-semibold">Branch</th>
                                <th className="px-5 py-3 font-semibold">Today's Sales</th>
                                <th className="px-5 py-3 font-semibold">Txns</th>
                                <th className="px-5 py-3 font-semibold">Staff</th>
                                <th className="px-5 py-3 font-semibold">Active Products</th>
                                <th className="px-5 py-3 font-semibold">Low Stock</th>
                                <th className="px-5 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {branches.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
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
                                                    <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-text-3 text-[13px]">
                                                    <span className="w-2 h-2 rounded-full bg-slate-600" />
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

            {/* Alerts */}
            <div className="bg-surface border border-border rounded-md overflow-hidden">
                <div className="p-5 border-b border-border">
                    <h2 className="text-sm font-bold text-text-1 uppercase tracking-widest">
                        Alerts
                    </h2>
                </div>
                <div className="p-5 space-y-2">
                    {alerts.length === 0 ? (
                        <p className="text-sm text-text-3">
                            All systems nominal — no active alerts.
                        </p>
                    ) : (
                        alerts.map((a, idx) => (
                            <div
                                key={`${a.branchId}-${a.type}-${idx}`}
                                className={`border rounded-lg px-4 py-3 text-sm ${alertTone(a.type)}`}
                            >
                                {a.message}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
