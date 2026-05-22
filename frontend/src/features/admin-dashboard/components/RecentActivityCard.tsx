import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Pill from '@/components/ui/Pill';
import type { ITransaction } from '@/types';
import { formatRevenue, formatTime } from '../lib/format';

type TransactionWithCashier = ITransaction & {
    cashier?: { firstName: string; lastName: string };
};

interface RecentActivityCardProps {
    transactions: TransactionWithCashier[];
}

export function RecentActivityCard({ transactions }: RecentActivityCardProps) {
    return (
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
                {transactions.length > 0 ? (
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
                            {transactions.map((txn) => (
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
        </Card>
    );
}
