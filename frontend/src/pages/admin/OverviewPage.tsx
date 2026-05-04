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
            return 'text-red-400 border-red-500/30 bg-red-500/5';
        case 'no_admin':
            return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
        case 'no_transactions':
            return 'text-sky-400 border-sky-500/30 bg-sky-500/5';
        case 'inactive_branch':
            return 'text-slate-400 border-slate-500/30 bg-slate-500/5';
    }
}

export default function OverviewPage() {
    const { data, isLoading } = useQuery<IOverviewResponse>({
        queryKey: ['admin-overview'],
        queryFn: adminService.getOverview,
        refetchInterval: 30000,
    });

    if (isLoading || !data) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        System Overview
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        All branches at a glance
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-[#111111] border border-white/10 rounded-2xl p-5"
                    >
                        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            {card.title}
                        </p>
                        <p className="text-2xl font-bold text-white tracking-tight">
                            {card.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Branch Performance Table */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl mb-6 overflow-hidden">
                <div className="p-5 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                        Branch Performance
                    </h2>
                </div>
                <div className="overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
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
                                        className="px-5 py-12 text-center text-slate-500"
                                    >
                                        No branches yet
                                    </td>
                                </tr>
                            ) : (
                                branches.map((b) => (
                                    <tr
                                        key={b.branchId}
                                        className="border-b border-white/5 hover:bg-white/[0.02]"
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-slate-200 font-medium">
                                                    {b.branchName}
                                                </span>
                                                <span className="text-[11px] text-slate-500">
                                                    {b.adminName || 'No admin'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-200 font-medium">
                                            {formatCurrency(b.todaySales)}
                                        </td>
                                        <td className="px-5 py-3 text-slate-300">
                                            {b.todayTransactions}
                                        </td>
                                        <td className="px-5 py-3 text-slate-300">
                                            {b.staffCount}
                                        </td>
                                        <td className="px-5 py-3 text-slate-300">
                                            {b.activeProducts}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={
                                                    b.lowStockItems > 0
                                                        ? 'text-red-400 font-medium'
                                                        : 'text-slate-500'
                                                }
                                            >
                                                {b.lowStockItems}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {b.isActive ? (
                                                <span className="inline-flex items-center gap-1.5 text-white text-[13px]">
                                                    <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-slate-500 text-[13px]">
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
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                        Alerts
                    </h2>
                </div>
                <div className="p-5 space-y-2">
                    {alerts.length === 0 ? (
                        <p className="text-sm text-slate-500">
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
