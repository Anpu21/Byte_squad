import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pill from '@/components/ui/Pill';
import { formatRevenue, formatTime } from '@/features/admin-dashboard/lib/format';
import type { ITransaction } from '@/types';

interface CashierRecentTransactionsProps {
    transactions: ITransaction[];
}

export function CashierRecentTransactions({
    transactions,
}: CashierRecentTransactionsProps) {
    return (
        <Card>
            <div className="px-5 py-4 border-b border-border">
                <h3 className="text-[15px] font-semibold text-text-1">
                    Recent transactions
                </h3>
            </div>
            <div className="overflow-auto max-h-[320px]">
                {transactions.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2">
                                <th className="px-5 py-2.5 text-left font-semibold">
                                    Tx #
                                </th>
                                <th className="px-5 py-2.5 text-left font-semibold">
                                    Time
                                </th>
                                <th className="px-5 py-2.5 text-left font-semibold">
                                    Items
                                </th>
                                <th className="px-5 py-2.5 text-right font-semibold">
                                    Total
                                </th>
                                <th className="px-5 py-2.5 text-left font-semibold">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((txn) => (
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
                                        {(
                                            txn as ITransaction & {
                                                items?: unknown[];
                                            }
                                        ).items?.length ?? '—'}
                                    </td>
                                    <td className="px-5 py-3 mono text-[13px] font-semibold text-text-1 text-right">
                                        {formatRevenue(Number(txn.total))}
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
    );
}
