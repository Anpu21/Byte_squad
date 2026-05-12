import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { Calendar, CalendarDays, Download, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { posService } from '@/services/pos.service';
import type {
    ICashierTransactionsSummary,
    ICashierTransactionRow,
} from '@/types';
import KpiCard from '@/components/ui/KpiCard';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';

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

function downloadCsv(rows: ICashierTransactionRow[], scope: string) {
    const header = ['Transaction #', 'Date', 'Branch', 'Cashier', 'Items', 'Total'];
    const lines = [header.join(',')].concat(
        rows.map((t) =>
            [
                t.transactionNumber,
                new Date(t.createdAt).toISOString(),
                t.branchName ?? '',
                t.cashierName,
                String(t.itemCount),
                String(t.total),
            ]
                .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                .join(','),
        ),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;

    const { data, isLoading } = useQuery<ICashierTransactionsSummary>({
        queryKey: queryKeys.transactions.summary(isAdmin ? 'system' : 'self'),
        queryFn: isAdmin ? posService.getAllTransactions : posService.getMyTransactions,
        refetchInterval: 30000,
    });

    const subtitle = useMemo(() => {
        const scopeLabel =
            data?.scope === 'system'
                ? 'All branches'
                : data?.scope === 'branch'
                  ? 'Branch sales'
                  : `${user?.firstName ?? 'Your'} sales`;
        return `${scopeLabel} · ${data?.recentTransactions.length ?? 0} records`;
    }, [data, user]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const showBranchCol = data?.scope === 'system';
    const showCashierCol = data?.scope === 'branch' || data?.scope === 'system';

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                        Transactions
                    </h1>
                    <p className="text-sm text-text-2 mt-1">{subtitle}</p>
                </div>
                <Button
                    variant="secondary"
                    onClick={() =>
                        data &&
                        downloadCsv(data.recentTransactions, data.scope)
                    }
                    disabled={!data || data.recentTransactions.length === 0}
                >
                    <Download size={14} />
                    Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <CardHeader>
                    <div>
                        <CardTitle>All transactions</CardTitle>
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
                </CardHeader>
                <CardContent className="p-0">
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
                                        {showBranchCol && (
                                            <th className="px-5 py-2.5 text-left font-semibold">
                                                Branch
                                            </th>
                                        )}
                                        {showCashierCol && (
                                            <th className="px-5 py-2.5 text-left font-semibold">
                                                Cashier
                                            </th>
                                        )}
                                        <th className="px-5 py-2.5 text-right font-semibold">
                                            Items
                                        </th>
                                        <th className="px-5 py-2.5 text-right font-semibold">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentTransactions.map(
                                        (txn: ICashierTransactionRow) => (
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
                                                {showBranchCol && (
                                                    <td className="px-5 py-3 text-[13px] text-text-1">
                                                        {txn.branchName ?? '—'}
                                                    </td>
                                                )}
                                                {showCashierCol && (
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
                                        ),
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <EmptyState title="No transactions yet" />
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
