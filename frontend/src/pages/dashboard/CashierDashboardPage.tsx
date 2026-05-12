import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { Receipt } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { posService } from '@/services/pos.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { ICashierDashboard, ITransaction } from '@/types';
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

export function CashierDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery<ICashierDashboard>({
        queryKey: queryKeys.cashierDashboard(),
        queryFn: posService.getCashierDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
                        Hi {user?.firstName ?? 'there'}
                    </h1>
                    <p className="text-xs text-text-2 mt-1">{today}</p>
                </div>
                <Button size="lg" onClick={() => navigate(FRONTEND_ROUTES.POS)}>
                    <Receipt size={16} /> Open POS
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <KpiCard
                    label="Sales today"
                    value={formatCurrency(data?.today.totalSales ?? 0)}
                    delta={`${data?.today.transactionCount ?? 0} transactions`}
                    sparkData={sparkline.length >= 2 ? sparkline : [1, 2, 3, 4]}
                    sparkColor="var(--accent)"
                />
                <KpiCard
                    label="Transactions"
                    value={String(data?.today.transactionCount ?? 0)}
                    delta="completed"
                    sparkData={sparkline.length >= 2 ? sparkline : [2, 3, 4, 5]}
                />
                <KpiCard
                    label="Avg sale"
                    value={formatCurrency(data?.today.averageSale ?? 0)}
                    delta="per transaction"
                    sparkColor="var(--brand-400)"
                    sparkData={[3, 5, 4, 6, 5, 7]}
                />
                <KpiCard
                    label="Weekly total"
                    value={formatCurrency(data?.week.totalSales ?? 0)}
                    delta={`${data?.week.transactionCount ?? 0} txns`}
                    sparkData={sparkline.length >= 2 ? sparkline : [3, 4, 5, 6]}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="p-5">
                    <h3 className="text-[15px] font-semibold text-text-1 mb-3">
                        Last 7 days
                    </h3>
                    {chartData.length > 0 ? (
                        <BarChart
                            data={chartData}
                            height={260}
                            color="var(--primary)"
                            formatValue={(v) => formatCurrency(v)}
                        />
                    ) : (
                        <EmptyState title="No sales data yet" />
                    )}
                </Card>

                <Card>
                    <div className="px-5 py-4 border-b border-border">
                        <h3 className="text-[15px] font-semibold text-text-1">
                            Recent transactions
                        </h3>
                    </div>
                    <div className="overflow-auto max-h-[320px]">
                        {data && data.recentTransactions.length > 0 ? (
                            <table className="w-full">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                                        <th className="px-5 py-2.5 text-left font-semibold">Tx #</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Time</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Items</th>
                                        <th className="px-5 py-2.5 text-right font-semibold">Total</th>
                                        <th className="px-5 py-2.5 text-left font-semibold">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentTransactions.map((txn: ITransaction) => (
                                        <tr
                                            key={txn.id}
                                            className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                        >
                                            <td className="px-5 py-3 mono text-xs text-text-1">
                                                {txn.transactionNumber}
                                            </td>
                                            <td className="px-5 py-3 mono text-xs text-text-2">
                                                {formatTime(txn.createdAt)}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] text-text-2">
                                                {(txn as ITransaction & { items?: unknown[] })
                                                    .items?.length ?? '—'}
                                            </td>
                                            <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                                {formatCurrency(Number(txn.total))}
                                            </td>
                                            <td className="px-5 py-3">
                                                <Pill tone="success">Completed</Pill>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <EmptyState title="No transactions yet today" />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
