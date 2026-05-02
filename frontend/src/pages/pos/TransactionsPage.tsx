import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { posService } from '@/services/pos.service';
import type { ICashierTransactionsSummary, ICashierTransactionRow } from '@/types';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function TransactionsPage() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery<ICashierTransactionsSummary>({
        queryKey: ['cashier-transactions-summary'],
        queryFn: posService.getMyTransactions,
        refetchInterval: 30000,
    });

    const stats = data
        ? [
              {
                  title: 'Today',
                  value: formatCurrency(data.today.totalSales),
                  sub: `${data.today.transactionCount} transaction${data.today.transactionCount !== 1 ? 's' : ''}`,
                  icon: <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
              },
              {
                  title: 'This Month',
                  value: formatCurrency(data.month.totalSales),
                  sub: `${data.month.transactionCount} transaction${data.month.transactionCount !== 1 ? 's' : ''}`,
                  icon: <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />,
              },
              {
                  title: 'This Year',
                  value: formatCurrency(data.year.totalSales),
                  sub: `${data.year.transactionCount} transaction${data.year.transactionCount !== 1 ? 's' : ''}`,
                  icon: <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />,
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
                <h1 className="text-2xl font-bold text-white tracking-tight">Transactions</h1>
                <p className="text-sm text-slate-400 mt-1">
                    {data?.scope === 'branch'
                        ? 'Branch sales summary'
                        : `${user?.firstName ?? 'Your'}'s sales summary`}{' '}
                    &middot;{' '}
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
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

            {/* All Transactions */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-6 pb-4">
                    <h3 className="text-sm font-semibold text-white tracking-wide">All Transactions</h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                        {data?.recentTransactions.length ?? 0}{' '}
                        {data?.recentTransactions.length === 1 ? 'transaction' : 'transactions'}
                        {data?.scope === 'branch' ? ' across the branch' : ''}
                    </p>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    {data && data.recentTransactions.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#111111] z-10">
                                <tr className="text-[11px] uppercase tracking-widest text-slate-500 border-b border-white/10">
                                    <th className="px-6 py-3 font-semibold">Transaction #</th>
                                    <th className="px-6 py-3 font-semibold">Date / Time</th>
                                    {data.scope === 'branch' && (
                                        <th className="px-6 py-3 font-semibold">Cashier</th>
                                    )}
                                    <th className="px-6 py-3 font-semibold">Items</th>
                                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {data.recentTransactions.map((txn: ICashierTransactionRow) => (
                                    <tr key={txn.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-3">
                                            <span className="text-slate-300 font-mono text-xs">{txn.transactionNumber}</span>
                                        </td>
                                        <td className="px-6 py-3 text-slate-400 text-[13px]">
                                            {formatDateTime(txn.createdAt)}
                                        </td>
                                        {data.scope === 'branch' && (
                                            <td className="px-6 py-3 text-slate-400">{txn.cashierName}</td>
                                        )}
                                        <td className="px-6 py-3 text-slate-400">{txn.itemCount}</td>
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
