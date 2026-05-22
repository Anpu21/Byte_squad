import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { ICashierTransactionsSummary } from '@/types';
import { formatDateTime, formatRevenue } from '../lib/format';

interface TransactionsTableProps {
    data: ICashierTransactionsSummary;
    showBranchCol: boolean;
    showCashierCol: boolean;
}

function describeScope(scope: string): string {
    if (scope === 'system') return ' across all branches';
    if (scope === 'branch') return ' across the branch';
    return '';
}

export function TransactionsTable({
    data,
    showBranchCol,
    showCashierCol,
}: TransactionsTableProps) {
    const count = data.recentTransactions.length;

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>All transactions</CardTitle>
                    <p className="text-xs text-text-2 mt-0.5">
                        {count} {count === 1 ? 'transaction' : 'transactions'}
                        {describeScope(data.scope)}
                    </p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px]">
                    {count > 0 ? (
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
                                {data.recentTransactions.map((txn) => (
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
                                            {formatRevenue(Number(txn.total))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <EmptyState title="No transactions yet" />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
