import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
    AlertTriangle,
    Download,
    Receipt,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import { posService } from '@/services/pos.service';
import type { IAdminDashboard, ITopProduct, ITransaction } from '@/types';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import OverviewPage from '@/pages/admin/OverviewPage';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Pill from '@/components/ui/Pill';
import BarChart from '@/components/charts/BarChart';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDayShort(date: string) {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery<IAdminDashboard>({
        queryKey: queryKeys.admin.dashboard(),
        queryFn: posService.getAdminDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    })();

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    const sparkline = (data?.dailyBreakdown ?? [])
        .slice(-10)
        .map((d) => Number(d.totalSales));

    const chartData = (data?.dailyBreakdown ?? []).map((d) => ({
        name: formatDayShort(d.date),
        value: Number(d.totalSales),
    }));

    const todayRevenue = Number(data?.today.totalSales ?? 0);
    const todayCount = Number(data?.today.transactionCount ?? 0);
    const avgOrderValue = todayCount > 0 ? todayRevenue / todayCount : 0;
    const lowStockCount = Number(data?.stats.lowStockItems ?? 0);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                    <p className="text-xs text-text-2">{today}</p>
                    <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1 mt-0.5">
                        {greeting}, {user?.firstName ?? 'there'}
                    </h1>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="secondary" size="md">
                        <Download size={14} /> Export
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard
                    label="Today's revenue"
                    value={formatCurrency(todayRevenue)}
                    delta={`${todayCount} transactions`}
                    sparkData={sparkline.length >= 2 ? sparkline : [1, 2, 3, 4]}
                    sparkColor="var(--accent)"
                    icon={<TrendingUp size={14} />}
                />
                <KpiCard
                    label="Transactions"
                    value={String(todayCount)}
                    delta={`${data?.month.transactionCount ?? 0} this month`}
                    sparkColor="var(--primary)"
                    sparkData={sparkline.length >= 2 ? sparkline : [2, 3, 4, 5]}
                    icon={<Receipt size={14} />}
                />
                <KpiCard
                    label="Avg order value"
                    value={formatCurrency(avgOrderValue)}
                    delta={`${data?.stats.activeProducts ?? 0} active products`}
                    sparkColor="var(--brand-400)"
                    sparkData={[3, 5, 4, 6, 5, 7]}
                    icon={<ShoppingCart size={14} />}
                />
                <KpiCard
                    label="Low stock items"
                    value={String(lowStockCount)}
                    delta={
                        lowStockCount > 0
                            ? 'Requires attention'
                            : 'All branches stocked'
                    }
                    deltaPositive={lowStockCount === 0}
                    sparkColor="var(--warning)"
                    sparkData={[2, 3, 3, 4, 4, 5]}
                    icon={<AlertTriangle size={14} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <Card className="lg:col-span-2 p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Sales overview
                            </h3>
                            <p className="text-xs text-text-2 mt-0.5">
                                Last 7 days · all branches
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-2">
                            <span className="inline-flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: 'var(--primary)' }}
                                />
                                Revenue
                            </span>
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <BarChart
                            data={chartData}
                            height={240}
                            color="var(--primary)"
                            formatValue={(v) => formatCurrency(v)}
                        />
                    ) : (
                        <EmptyState
                            title="No sales data yet"
                            description="Daily totals will appear here once transactions begin."
                        />
                    )}
                </Card>

                <Card className="p-5">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                                Top products today
                            </h3>
                            <p className="text-xs text-text-2 mt-0.5">
                                Ranked by revenue
                            </p>
                        </div>
                    </div>
                    {data && data.topProducts.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {data.topProducts
                                .slice(0, 5)
                                .map((product: ITopProduct, idx: number) => {
                                    const maxRevenue =
                                        data.topProducts[0]?.totalRevenue || 1;
                                    const pct =
                                        (product.totalRevenue / maxRevenue) * 100;
                                    return (
                                        <div key={product.productId}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="mono text-xs text-text-3 w-4">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="text-[13px] font-medium text-text-1 truncate">
                                                        {product.productName}
                                                    </span>
                                                </div>
                                                <span className="mono text-xs text-text-1 font-semibold flex-shrink-0">
                                                    {formatCurrency(
                                                        product.totalRevenue,
                                                    )}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <p className="mono text-[11px] text-text-3 mt-0.5">
                                                {product.totalQuantity} sold
                                            </p>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <EmptyState title="No product data yet" />
                    )}
                </Card>
            </div>

            {isAdmin && (
                <div className="mb-4">
                    <OverviewPage embedded />
                </div>
            )}

            <Card>
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h3 className="text-[15px] font-semibold text-text-1 tracking-tight">
                            Recent activity
                        </h3>
                        <p className="text-xs text-text-2 mt-0.5">
                            Latest sales across all branches
                        </p>
                    </div>
                </div>
                <div className="overflow-auto max-h-[420px]">
                    {data && data.recentTransactions.length > 0 ? (
                        <table className="w-full">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Transaction
                                    </th>
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Cashier
                                    </th>
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Time
                                    </th>
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Method
                                    </th>
                                    <th className="px-5 py-2.5 text-right font-semibold">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentTransactions.map(
                                    (
                                        txn: ITransaction & {
                                            cashier?: {
                                                firstName: string;
                                                lastName: string;
                                            };
                                        },
                                    ) => (
                                        <tr
                                            key={txn.id}
                                            className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                        >
                                            <td className="px-5 py-3 mono text-xs text-text-1">
                                                {txn.transactionNumber}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] text-text-2">
                                                {txn.cashier
                                                    ? `${txn.cashier.firstName} ${txn.cashier.lastName}`
                                                    : '—'}
                                            </td>
                                            <td className="px-5 py-3 mono text-xs text-text-2">
                                                {formatTime(txn.createdAt)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Pill tone="neutral" dot={false}>
                                                    {txn.paymentMethod}
                                                </Pill>
                                            </td>
                                            <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                                {formatCurrency(Number(txn.total))}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState title="No transactions yet" />
                    )}
                </div>
            </Card>
        </div>
    );
}
