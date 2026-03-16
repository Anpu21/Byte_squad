import { useQuery } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { IAdminDashboard, ITopProduct, ITransaction } from '@/types';

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

export default function DashboardPage() {
    const { data, isLoading } = useQuery<IAdminDashboard>({
        queryKey: ['admin-dashboard'],
        queryFn: posService.getAdminDashboard,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    const stats = data
        ? [
              {
                  title: "Today's Sales",
                  value: formatCurrency(data.today.totalSales),
                  trend: `${data.today.transactionCount} transactions`,
                  isPositive: data.today.totalSales > 0,
                  icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
              },
              {
                  title: 'Monthly Revenue',
                  value: formatCurrency(data.month.totalRevenue),
                  trend: `${data.month.transactionCount} transactions`,
                  isPositive: data.month.totalRevenue > 0,
                  icon: <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />,
              },
              {
                  title: 'Active Products',
                  value: String(data.stats.activeProducts),
                  trend: `${data.stats.totalBranches} branches`,
                  isPositive: true,
                  icon: <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />,
              },
              {
                  title: 'Low Stock Items',
                  value: String(data.stats.lowStockItems),
                  trend: 'Requires attention',
                  isPositive: data.stats.lowStockItems === 0,
                  icon: <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01" />,
              },
          ]
        : [];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">Overview of your store's performance</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{data?.stats.totalUsers ?? 0} users</span>
                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                    <span>{data?.stats.totalBranches ?? 0} branches</span>
                </div>
            </div>

            {/* Stat Cards Grid */}
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
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-[11px] font-semibold flex items-center gap-0.5 ${stat.isPositive ? 'text-white' : 'text-slate-400'}`}>
                                    {stat.isPositive ? (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m18 15-6-6-6 6" />
                                        </svg>
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m6 9 6 6 6-6" />
                                        </svg>
                                    )}
                                    {stat.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                {/* Sales Overview Chart */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-semibold text-white tracking-wide">Sales Overview</h3>
                        <span className="text-xs text-slate-500">Last 7 days</span>
                    </div>
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
                                    labelFormatter={(v: string) => formatDay(v)}
                                    formatter={(value: number) => [formatCurrency(value), 'Sales']}
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

                {/* Top Selling Products */}
                <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 pb-4">
                        <h3 className="text-sm font-semibold text-white tracking-wide">Top Selling Products</h3>
                        <p className="text-[11px] text-slate-500 mt-1">This month by revenue</p>
                    </div>
                    {data && data.topProducts.length > 0 ? (
                        <div className="px-6 pb-6 space-y-3">
                            {data.topProducts.map((product: ITopProduct, idx: number) => {
                                const maxRevenue = data.topProducts[0]?.totalRevenue || 1;
                                const pct = (product.totalRevenue / maxRevenue) * 100;
                                return (
                                    <div key={product.productId}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-[11px] text-slate-500 font-mono w-4">{idx + 1}</span>
                                                <span className="text-sm text-slate-200 font-medium">{product.productName}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-white font-semibold">{formatCurrency(product.totalRevenue)}</span>
                                                <span className="text-[11px] text-slate-500 ml-2">{product.totalQuantity} sold</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white/30 rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-6 pb-6 h-[240px] flex items-center justify-center text-slate-500 text-sm">
                            No product data yet
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 pb-4 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white tracking-wide">Recent Transactions</h3>
                    <span className="text-xs text-slate-500">All branches</span>
                </div>
                <div className="overflow-auto max-h-[360px]">
                    {data && data.recentTransactions.length > 0 ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                    <th className="px-6 py-3 font-semibold sticky top-0 bg-[#111111]">Transaction</th>
                                    <th className="px-6 py-3 font-semibold sticky top-0 bg-[#111111]">Cashier</th>
                                    <th className="px-6 py-3 font-semibold sticky top-0 bg-[#111111]">Time</th>
                                    <th className="px-6 py-3 font-semibold sticky top-0 bg-[#111111]">Method</th>
                                    <th className="px-6 py-3 font-semibold text-right sticky top-0 bg-[#111111]">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {data.recentTransactions.map((txn: ITransaction & { cashier?: { firstName: string; lastName: string } }) => (
                                    <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="text-slate-300 font-mono text-xs">{txn.transactionNumber}</span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400">
                                            {txn.cashier ? `${txn.cashier.firstName} ${txn.cashier.lastName}` : '—'}
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-[13px]">
                                            {formatTime(txn.createdAt)}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-white/10 text-slate-300 uppercase">
                                                {txn.paymentMethod}
                                            </span>
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
                            No transactions yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
