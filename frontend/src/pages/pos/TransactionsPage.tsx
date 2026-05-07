import { useQuery } from '@tanstack/react-query';
import { Calendar, CalendarDays, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { posService } from '@/services/pos.service';
import type {
    ICashierTransactionsSummary,
    ICashierTransactionRow,
} from '@/types';
import KpiCard from '@/components/ui/KpiCard';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
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
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery<ICashierTransactionsSummary>({
        queryKey: ['transactions-summary', isAdmin ? 'system' : 'self'],
        queryFn: isAdmin ? posService.getAllTransactions : posService.getMyTransactions,
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const subtitle = `${
        data?.scope === 'system'
            ? 'All branches sales summary'
            : data?.scope === 'branch'
              ? 'Branch sales summary'
              : `${user?.firstName ?? 'Your'} sales summary`
    } · ${data?.recentTransactions.length ?? 0} records`;

    return (
        <div className="animate-in fade-in duration-500">
            <PageHeader title="Transactions" subtitle={subtitle} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <KpiCard
                    label="Today"
                    value={formatCurrency(data?.today.totalSales ?? 0)}
                    delta={`${data?.today.transactionCount ?? 0} transactions`}
                    sparkData={[2, 3, 4, 5, 7, 6, 8]}
                    sparkColor="var(--accent)"
                    icon={<Calendar size={14} />}
                />
                <KpiCard
                    label="This month"
                    value={formatCurrency(data?.month.totalSales ?? 0)}
                    delta={`${data?.month.transactionCount ?? 0} transactions`}
                    sparkData={[3, 4, 5, 7, 6, 8, 10]}
                    icon={<CalendarDays size={14} />}
                />
                <KpiCard
                    label="This year"
                    value={formatCurrency(data?.year.totalSales ?? 0)}
                    delta={`${data?.year.transactionCount ?? 0} transactions`}
                    sparkData={[4, 5, 6, 7, 8, 9, 11]}
                    sparkColor="var(--brand-400)"
                    icon={<TrendingUp size={14} />}
                />
            </div>

            <Card>
                <div className="px-5 py-4 border-b border-border">
                    <h3 className="text-[15px] font-semibold text-text-1">
                        All transactions
                    </h3>
                    <p className="text-xs text-text-2 mt-0.5">
                        {data?.recentTransactions.length ?? 0}{' '}
                        {data?.recentTransactions.length === 1
                            ? 'transaction'
                            : 'transactions'}
                        {data?.scope === 'system'
                            ? ' across all branches'
                            : data?.scope === 'branch'
                              ? ' across the branch'
                              : ''}
                    </p>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    {data && data.recentTransactions.length > 0 ? (
                        <table className="w-full">
                            <thead className="sticky top-0 bg-surface-2 z-10">
                                <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 border-b border-border">
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Transaction #
                                    </th>
                                    <th className="px-5 py-2.5 text-left font-semibold">
                                        Date / Time
                                    </th>
                                    {data.scope === 'system' && (
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Branch
                                        </th>
                                    )}
                                    {(data.scope === 'branch' || data.scope === 'system') && (
                                        <th className="px-5 py-2.5 text-left font-semibold">
                                            Cashier
                                        </th>
                                    )}
                                    <th className="px-5 py-2.5 text-right font-semibold">
                                        Items
                                    </th>
                                    <th className="px-5 py-2.5 text-right font-semibold">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.recentTransactions.map((txn: ICashierTransactionRow) => (
                                    <tr
                                        key={txn.id}
                                        className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
                                    >
                                        <td className="px-5 py-3 mono text-xs text-text-1">
                                            {txn.transactionNumber}
                                        </td>
                                        <td className="px-5 py-3 mono text-xs text-text-2">
                                            {formatDateTime(txn.createdAt)}
                                        </td>
                                        {data.scope === 'system' && (
                                            <td className="px-5 py-3 text-[13px] text-text-1">
                                                {txn.branchName ?? '—'}
                                            </td>
                                        )}
                                        {(data.scope === 'branch' || data.scope === 'system') && (
                                            <td className="px-5 py-3 text-[13px] text-text-2">
                                                {txn.cashierName}
                                            </td>
                                        )}
                                        <td className="px-5 py-3 mono text-[13px] text-text-1 text-right">
                                            {txn.itemCount}
                                        </td>
                                        <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                            {formatCurrency(Number(txn.total))}
                                        </td>
                                    </tr>
                                ))}
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
