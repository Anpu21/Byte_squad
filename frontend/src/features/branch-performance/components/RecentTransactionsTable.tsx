import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole, formatDateTime } from '../lib/format';

interface RecentTransactionsTableProps {
    recentTransactions: IMyBranchPerformance['recentTransactions'];
}

export function RecentTransactionsTable({
    recentTransactions,
}: RecentTransactionsTableProps) {
    return (
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
                            <th className="px-5 py-2.5 font-semibold">Cashier</th>
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
                                    {formatCurrencyWhole(t.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </Card>
    );
}
