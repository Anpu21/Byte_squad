import { useQuery } from '@tanstack/react-query';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { branchesService } from '@/services/branches.service';
import type { IMyBranchPerformance } from '@/types';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDateShort(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

interface TooltipPayload {
    active?: boolean;
    payload?: { value: number; payload: { label: string } }[];
}

function ChartTooltip({ active, payload }: TooltipPayload) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 shadow-2xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {payload[0].payload.label}
            </p>
            <p className="text-sm font-bold text-white tabular-nums">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
    );
}

export default function BranchPerformancePage() {
    const { data, isLoading, isError, error, refetch } =
        useQuery<IMyBranchPerformance>({
            queryKey: ['my-branch-performance'],
            queryFn: branchesService.getMyPerformance,
            refetchInterval: 30000,
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-[#111111] border border-red-500/30 rounded-2xl p-6">
                <p className="text-red-400 font-semibold mb-2">
                    Failed to load branch performance
                </p>
                <p className="text-sm text-slate-400 mb-4">
                    {error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'}
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    const {
        branch,
        admin,
        today,
        week,
        month,
        staff,
        inventory,
        topProducts,
        lowStockList,
        recentTransactions,
    } = data;

    const chartData = week.dailyBreakdown.map((d) => ({
        label: formatDateShort(d.date),
        sales: d.sales,
    }));

    const todayCards = [
        {
            title: "Today's Sales",
            value: formatCurrency(today.sales),
            sub: `${today.transactions} transactions`,
        },
        {
            title: 'Avg Transaction',
            value: formatCurrency(today.avgTransaction),
            sub: 'Today',
        },
        {
            title: 'This Week',
            value: formatCurrency(week.sales),
            sub: `${week.transactions} transactions`,
        },
        {
            title: 'Staff',
            value: String(staff.total),
            sub: `${staff.byRole.cashier} cashier${staff.byRole.cashier === 1 ? '' : 's'}`,
        },
    ];

    const monthCards = [
        {
            title: 'Month Revenue',
            value: formatCurrency(month.revenue),
            sub: `${month.transactions} txns`,
            tone: 'default' as const,
        },
        {
            title: 'Month Expenses',
            value: formatCurrency(month.expenses),
            sub: 'This month',
            tone: 'default' as const,
        },
        {
            title: 'Net Profit',
            value: formatCurrency(month.netProfit),
            sub: month.netProfit >= 0 ? 'Profitable' : 'Loss',
            tone: month.netProfit >= 0
                ? ('positive' as const)
                : ('negative' as const),
        },
        {
            title: 'Low Stock Alerts',
            value: String(inventory.lowStockItems),
            sub: `${inventory.outOfStock} out of stock`,
            tone:
                inventory.lowStockItems > 0
                    ? ('warning' as const)
                    : ('default' as const),
        },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header: Branch info */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {branch.name}
                            </h1>
                            {branch.isActive ? (
                                <span className="inline-flex items-center gap-1.5 text-white text-[13px] bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-slate-500 text-[13px] bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full bg-slate-600" />
                                    Inactive
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-400">{branch.address}</p>
                        <p className="text-sm text-slate-400">{branch.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                            Branch Admin
                        </p>
                        {admin ? (
                            <>
                                <p className="text-sm font-semibold text-white">
                                    {admin.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {admin.email}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-amber-400">
                                No admin assigned
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Today KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {todayCards.map((card) => (
                    <div
                        key={card.title}
                        className="bg-[#111111] border border-white/10 rounded-2xl p-5"
                    >
                        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                            {card.title}
                        </p>
                        <p className="text-2xl font-bold text-white tracking-tight tabular-nums">
                            {card.value}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Month KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {monthCards.map((card) => {
                    const valueClass =
                        card.tone === 'positive'
                            ? 'text-emerald-400'
                            : card.tone === 'negative'
                              ? 'text-red-400'
                              : card.tone === 'warning'
                                ? 'text-amber-400'
                                : 'text-white';
                    return (
                        <div
                            key={card.title}
                            className="bg-[#111111] border border-white/10 rounded-2xl p-5"
                        >
                            <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                                {card.title}
                            </p>
                            <p
                                className={`text-2xl font-bold tracking-tight tabular-nums ${valueClass}`}
                            >
                                {card.value}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {card.sub}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Sales chart (last 7 days) */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                        Sales — Last 7 Days
                    </h2>
                    <p className="text-xs text-slate-500">
                        Total: {formatCurrency(week.sales)}
                    </p>
                </div>
                <div className="h-[280px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="colorBranchSales"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#ffffff"
                                        stopOpacity={0.15}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#ffffff"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="rgba(255,255,255,0.05)"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: '#64748b',
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: '#64748b',
                                    fontSize: 11,
                                    fontWeight: 500,
                                }}
                                tickFormatter={(value: number) => `Rs ${value}`}
                                dx={-10}
                            />
                            <Tooltip
                                content={<ChartTooltip />}
                                cursor={{
                                    stroke: 'rgba(255,255,255,0.2)',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#ffffff"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBranchSales)"
                                activeDot={{
                                    r: 4,
                                    fill: '#0a0a0a',
                                    stroke: '#ffffff',
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Products + Low Stock two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Top Products */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                            Top Products — Last 30 Days
                        </h2>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                    <th className="px-5 py-3 font-semibold">
                                        Product
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Qty
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {topProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            No sales data yet
                                        </td>
                                    </tr>
                                ) : (
                                    topProducts.map((p) => (
                                        <tr
                                            key={p.productId}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-5 py-3 text-slate-200 font-medium">
                                                {p.name}
                                            </td>
                                            <td className="px-5 py-3 text-right text-slate-300 tabular-nums">
                                                {p.quantity}
                                            </td>
                                            <td className="px-5 py-3 text-right text-white font-medium tabular-nums">
                                                {formatCurrency(p.revenue)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Low Stock */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                            Low Stock Items
                        </h2>
                        {lowStockList.length > 0 && (
                            <span className="text-[11px] text-red-400 font-semibold bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                                {inventory.lowStockItems} total
                            </span>
                        )}
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                    <th className="px-5 py-3 font-semibold">
                                        Product
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Qty
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Threshold
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {lowStockList.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            All stock levels healthy
                                        </td>
                                    </tr>
                                ) : (
                                    lowStockList.map((item) => {
                                        const isOut = item.quantity === 0;
                                        return (
                                            <tr
                                                key={item.productId}
                                                className="border-b border-white/5 hover:bg-white/[0.02]"
                                            >
                                                <td className="px-5 py-3 text-slate-200 font-medium">
                                                    {item.name}
                                                </td>
                                                <td
                                                    className={`px-5 py-3 text-right font-bold tabular-nums ${
                                                        isOut
                                                            ? 'text-red-400'
                                                            : 'text-amber-400'
                                                    }`}
                                                >
                                                    {item.quantity}
                                                </td>
                                                <td className="px-5 py-3 text-right text-slate-500 tabular-nums">
                                                    {item.threshold}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Staff breakdown + Recent transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Staff by role */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4">
                        Staff by Role
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Admin', count: staff.byRole.admin },
                            { label: 'Manager', count: staff.byRole.manager },
                            { label: 'Cashier', count: staff.byRole.cashier },
                        ].map((r) => (
                            <div
                                key={r.label}
                                className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0"
                            >
                                <span className="text-sm text-slate-400">
                                    {r.label}
                                </span>
                                <span className="text-sm font-bold text-white tabular-nums">
                                    {r.count}
                                </span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-slate-300 font-semibold">
                                Total
                            </span>
                            <span className="text-lg font-bold text-white tabular-nums">
                                {staff.total}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recent transactions */}
                <div className="lg:col-span-2 bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-white/10">
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                            Recent Transactions
                        </h2>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                    <th className="px-5 py-3 font-semibold">
                                        Txn #
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Cashier
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        When
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {recentTransactions.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-5 py-12 text-center text-slate-500"
                                        >
                                            No transactions yet
                                        </td>
                                    </tr>
                                ) : (
                                    recentTransactions.map((t) => (
                                        <tr
                                            key={t.id}
                                            className="border-b border-white/5 hover:bg-white/[0.02]"
                                        >
                                            <td className="px-5 py-3 text-slate-300 font-mono text-xs">
                                                {t.transactionNumber}
                                            </td>
                                            <td className="px-5 py-3 text-slate-300">
                                                {t.cashierName}
                                            </td>
                                            <td className="px-5 py-3 text-slate-500 text-xs">
                                                {formatDateTime(t.createdAt)}
                                            </td>
                                            <td className="px-5 py-3 text-right text-white font-medium tabular-nums">
                                                {formatCurrency(t.total)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
