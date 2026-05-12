import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
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
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import Pill from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
import { Building2, AlertTriangle } from 'lucide-react';

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
        <div className="bg-surface border border-border rounded-md p-3 shadow-md-token">
            <p className="text-[11px] font-semibold text-text-2 uppercase tracking-wider mb-1">
                {payload[0].payload.label}
            </p>
            <p className="mono text-sm font-bold text-text-1">
                {formatCurrency(payload[0].value)}
            </p>
        </div>
    );
}

export default function BranchPerformancePage() {
    const { data, isLoading, isError, error, refetch } =
        useQuery<IMyBranchPerformance>({
            queryKey: queryKeys.branch.myPerformance(),
            queryFn: branchesService.getMyPerformance,
            refetchInterval: 30000,
        });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="bg-surface border border-danger/40 rounded-md p-6">
                <p className="text-danger font-semibold mb-2">
                    Failed to load branch performance
                </p>
                <p className="text-sm text-text-2 mb-4">
                    {error instanceof Error
                        ? error.message
                        : 'Unknown error occurred'}
                </p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-primary text-text-inv rounded-md text-sm font-semibold hover:bg-primary-hover transition-colors"
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Branch header card */}
            <Card className="p-6 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                                {branch.name}
                            </h1>
                            <Pill tone={branch.isActive ? 'success' : 'neutral'}>
                                {branch.isActive ? 'Active' : 'Inactive'}
                            </Pill>
                        </div>
                        <p className="text-sm text-text-2">
                            {branch.address}
                            {admin && (
                                <span>
                                    {' '}· Manager: <span className="text-text-1 font-medium">{admin.name}</span>
                                </span>
                            )}
                        </p>
                        <p className="text-xs text-text-3 mt-0.5">
                            {branch.phone}
                        </p>
                    </div>
                </div>
            </Card>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <KpiCard
                    label="Today's revenue"
                    value={formatCurrency(today.sales)}
                    delta={`${today.transactions} transactions`}
                    sparkColor="var(--accent)"
                    sparkData={chartData.map((c) => c.sales).slice(-7) || [1, 2]}
                />
                <KpiCard
                    label="Avg transaction"
                    value={formatCurrency(today.avgTransaction)}
                    delta="Today"
                    sparkColor="var(--primary)"
                    sparkData={[3, 4, 5, 4, 6, 5, 7]}
                />
                <KpiCard
                    label="This week"
                    value={formatCurrency(week.sales)}
                    delta={`${week.transactions} transactions`}
                    sparkColor="var(--brand-400)"
                    sparkData={chartData.map((c) => c.sales) || [1, 2]}
                />
                <KpiCard
                    label="Low stock items"
                    value={String(inventory.lowStockItems)}
                    delta={`${inventory.outOfStock} out of stock`}
                    deltaPositive={inventory.lowStockItems === 0}
                    sparkColor="var(--warning)"
                    sparkData={[2, 3, 4, 3, 4, 5, 4]}
                />
            </div>

            {/* Two-column: Low stock alerts + Staff by role */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Low stock alerts (2/3) */}
                <Card className="lg:col-span-2 overflow-hidden">
                    <div className="p-5 border-b border-border flex items-center justify-between">
                        <div>
                            <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Low stock alerts
                            </h3>
                            <p className="text-xs text-text-2 mt-0.5">
                                Items at or below threshold
                            </p>
                        </div>
                        {lowStockList.length > 0 && (
                            <Pill tone="danger">{inventory.lowStockItems} total</Pill>
                        )}
                    </div>
                    {lowStockList.length === 0 ? (
                        <EmptyState
                            icon={<AlertTriangle size={20} />}
                            title="All stock levels healthy"
                            description="No items are currently below their threshold."
                        />
                    ) : (
                        <div className="divide-y divide-border">
                            {lowStockList.map((item) => {
                                const isOut = item.quantity === 0;
                                return (
                                    <div
                                        key={item.productId}
                                        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-2 transition-colors"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[13px] font-medium text-text-1 truncate">
                                                {item.name}
                                            </p>
                                            <p className="text-xs text-text-3 mt-0.5">
                                                on hand{' '}
                                                <span
                                                    className={`mono font-semibold ${
                                                        isOut
                                                            ? 'text-danger'
                                                            : 'text-warning'
                                                    }`}
                                                >
                                                    {item.quantity}
                                                </span>{' '}
                                                / {item.threshold}
                                            </p>
                                        </div>
                                        <Pill tone={isOut ? 'danger' : 'warning'}>
                                            {isOut ? 'Out of stock' : 'Low'}
                                        </Pill>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Staff by role (1/3) */}
                <Card className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Team
                            </h3>
                            <p className="text-xs text-text-2 mt-0.5">
                                {staff.total} member{staff.total === 1 ? '' : 's'}
                            </p>
                        </div>
                        <Building2 size={16} className="text-text-3" />
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Admin', count: staff.byRole.admin },
                            { label: 'Manager', count: staff.byRole.manager },
                            { label: 'Cashier', count: staff.byRole.cashier },
                        ].map((r) => (
                            <div
                                key={r.label}
                                className="flex items-center justify-between"
                            >
                                <span className="text-[13px] text-text-2">
                                    {r.label}
                                </span>
                                <span className="mono text-sm font-semibold text-text-1">
                                    {r.count}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-text-1">
                            Total
                        </span>
                        <span className="mono text-lg font-bold text-text-1">
                            {staff.total}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Sales chart */}
            <Card className="p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                            Sales — last 7 days
                        </h3>
                        <p className="text-xs text-text-2 mt-0.5">
                            Total: <span className="mono font-medium text-text-1">{formatCurrency(week.sales)}</span>
                        </p>
                    </div>
                </div>
                <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
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
                                        stopColor="var(--primary)"
                                        stopOpacity={0.25}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="var(--primary)"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="var(--border)"
                            />
                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: 'var(--text-3)',
                                    fontSize: 11,
                                }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: 'var(--text-3)',
                                    fontSize: 11,
                                }}
                                tickFormatter={(value: number) => `${value / 1000}k`}
                                dx={-4}
                            />
                            <Tooltip
                                content={<ChartTooltip />}
                                cursor={{
                                    stroke: 'var(--border-strong)',
                                    strokeWidth: 1,
                                    strokeDasharray: '4 4',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="var(--primary)"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBranchSales)"
                                activeDot={{
                                    r: 4,
                                    fill: 'var(--primary)',
                                    stroke: 'var(--surface)',
                                    strokeWidth: 2,
                                }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Month KPIs row (compact) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <Card className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                        Month revenue
                    </p>
                    <p className="mono text-xl font-semibold text-text-1">
                        {formatCurrency(month.revenue)}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">
                        {month.transactions} transactions
                    </p>
                </Card>
                <Card className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                        Month expenses
                    </p>
                    <p className="mono text-xl font-semibold text-text-1">
                        {formatCurrency(month.expenses)}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">This month</p>
                </Card>
                <Card className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1">
                        Net profit
                    </p>
                    <p
                        className={`mono text-xl font-semibold ${
                            month.netProfit >= 0 ? 'text-accent-text' : 'text-danger'
                        }`}
                    >
                        {formatCurrency(month.netProfit)}
                    </p>
                    <p className="text-xs text-text-3 mt-0.5">
                        {month.netProfit >= 0 ? 'Profitable' : 'Loss'}
                    </p>
                </Card>
            </div>

            {/* Top products + Recent transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                            Top products
                        </h3>
                        <p className="text-xs text-text-2 mt-0.5">Last 30 days</p>
                    </div>
                    {topProducts.length === 0 ? (
                        <EmptyState title="No sales data yet" />
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                                    <th className="px-5 py-2.5 font-semibold">
                                        Product
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Qty
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Revenue
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((p) => (
                                    <tr
                                        key={p.productId}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-5 py-3 text-[13px] text-text-1 font-medium">
                                            {p.name}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] text-text-2 text-right">
                                            {p.quantity}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                            {formatCurrency(p.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>

                <Card className="overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                            Recent transactions
                        </h3>
                        <p className="text-xs text-text-2 mt-0.5">
                            Latest at this branch
                        </p>
                    </div>
                    {recentTransactions.length === 0 ? (
                        <EmptyState title="No transactions yet" />
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                                    <th className="px-5 py-2.5 font-semibold">Tx#</th>
                                    <th className="px-5 py-2.5 font-semibold">
                                        Cashier
                                    </th>
                                    <th className="px-5 py-2.5 font-semibold">When</th>
                                    <th className="px-5 py-2.5 font-semibold text-right">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTransactions.map((t) => (
                                    <tr
                                        key={t.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-5 py-3 mono text-xs text-text-1">
                                            {t.transactionNumber}
                                        </td>
                                        <td className="px-5 py-3 text-[13px] text-text-2">
                                            {t.cashierName}
                                        </td>
                                        <td className="px-5 py-3 mono text-xs text-text-3">
                                            {formatDateTime(t.createdAt)}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                            {formatCurrency(t.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Card>
            </div>
        </div>
    );
}
