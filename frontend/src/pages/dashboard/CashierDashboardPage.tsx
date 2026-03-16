import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { posService } from '@/services/pos.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { ICashierDashboard, ITransaction } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
}

function formatDay(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function CashierDashboardPage() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<ICashierDashboard>({
        queryKey: ['cashier-dashboard'],
        queryFn: posService.getCashierDashboard,
        refetchInterval: 30000, // refresh every 30s
    });

    const stats = data
        ? [
              {
                  title: "Today's Sales",
                  value: formatCurrency(data.today.totalSales),
                  sub: `${data.today.transactionCount} transaction${data.today.transactionCount !== 1 ? 's' : ''}`,
                  icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
              },
              {
                  title: 'Transactions Today',
                  value: String(data.today.transactionCount),
                  sub: 'completed',
                  icon: <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l4.58-4.58c.94-.94.94-2.48 0-3.42L9 5ZM6 9h.01" />,
              },
              {
                  title: 'Average Sale',
                  value: formatCurrency(data.today.averageSale),
                  sub: 'per transaction',
                  icon: <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />,
              },
              {
                  title: 'Weekly Total',
                  value: formatCurrency(data.week.totalSales),
                  sub: `${data.week.transactionCount} transactions`,
                  icon: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
              },
          ]
        : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    {getGreeting()}, {user?.firstName}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.title}
                        className="bg-[#111111] border border-white/10 rounded-2xl p-5 hover:border-white/20 hover:bg-[#161616] transition-all duration-300"
                    >
                        <div className="flex items-start justify-between">
                            <p className="text-[13px] font-medium text-slate-400">{stat.title}</p>
                            <div className="p-2 bg-white/5 rounded-lg text-slate-300">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {stat.icon}
                                </svg>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                            <p className="text-[11px] text-slate-500 mt-1 font-medium">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Sales Chart */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-white tracking-wide mb-6">Last 7 Days</h3>
                    {data && data.dailyBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={data.dailyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(v: string) => {
                                        const d = new Date(v + 'T00:00:00');
                                        return d.toLocaleDateString('en-US', { weekday: 'short' });
                                    }}
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v: number) => `Rs ${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                    }}
                                    labelFormatter={(label) => formatDay(String(label))}
                                    formatter={(value) => [formatCurrency(Number(value ?? 0)), 'Sales']}
                                />
                                <Bar dataKey="totalSales" fill="rgba(255,255,255,0.8)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
                            No sales data yet
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 pb-4">
                        <h3 className="text-sm font-semibold text-white tracking-wide">Recent Transactions</h3>
                    </div>
                    <div className="overflow-auto max-h-[320px]">
                        {data && data.recentTransactions.length > 0 ? (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                        <th className="px-6 py-3 font-semibold">Transaction</th>
                                        <th className="px-6 py-3 font-semibold">Time</th>
                                        <th className="px-6 py-3 font-semibold">Items</th>
                                        <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {data.recentTransactions.map((txn: ITransaction) => (
                                        <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="text-slate-300 font-mono text-xs">{txn.transactionNumber}</span>
                                            </td>
                                            <td className="px-6 py-3 text-slate-400 text-[13px]">
                                                {formatTime(txn.createdAt)}
                                            </td>
                                            <td className="px-6 py-3 text-slate-400">
                                                {(txn as ITransaction & { items?: unknown[] }).items?.length ?? '—'}
                                            </td>
                                            <td className="px-6 py-3 text-white font-medium text-right">
                                                {formatCurrency(Number(txn.total))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-6 py-12 text-center text-slate-500 text-sm">
                                No transactions yet today
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
