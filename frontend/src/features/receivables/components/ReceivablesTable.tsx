import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { IReceivableRow } from '@/types';

interface IReceivablesTableProps {
    rows: IReceivableRow[];
    isLoading: boolean;
    onOpenStatement: (row: IReceivableRow) => void;
}

/** Customers with live balances / unpaid credit sales, aged by sale date. */
export function ReceivablesTable({
    rows,
    isLoading,
    onOpenStatement,
}: IReceivablesTableProps) {
    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No receivables"
                description="No customer owes anything right now — credit sales will appear here with ageing buckets."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2.5 font-medium">Customer</th>
                        <th className="px-3 py-2.5 font-medium">Phone</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Balance
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Limit
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            0–30d
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            31–60d
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            61–90d
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            90d+
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r) => (
                        <tr
                            key={r.userId}
                            className="border-b border-border hover:bg-surface-2/40 transition-colors"
                        >
                            <td className="px-3 py-2.5 text-[13px] font-medium text-text-1">
                                {r.firstName} {r.lastName}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                {r.phone ?? '—'}
                            </td>
                            <td
                                className={`px-3 py-2.5 text-[13px] text-right tabular-nums font-semibold ${
                                    r.currentBalance > 0
                                        ? 'text-danger'
                                        : r.currentBalance < 0
                                          ? 'text-accent-text'
                                          : 'text-text-2'
                                }`}
                            >
                                {formatCurrency(r.currentBalance)}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {r.creditLimit === null
                                    ? '∞'
                                    : formatCurrency(r.creditLimit)}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {formatCurrency(r.b0to30)}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {formatCurrency(r.b31to60)}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-warning text-right tabular-nums">
                                {formatCurrency(r.b61to90)}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-danger text-right tabular-nums">
                                {formatCurrency(r.b90plus)}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onOpenStatement(r)}
                                >
                                    Statement
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
