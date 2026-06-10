import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import { usePayablesAgeing } from '../../hooks/usePayablesAgeing';
import { usePayablesOutstanding } from '../../hooks/usePayablesOutstanding';

/**
 * Payables position: per-supplier outstanding (opening + bills − payments)
 * and the ageing of unpaid bill remainders by days overdue.
 */
export function AgeingPanel() {
    const outstandingQuery = usePayablesOutstanding();
    const ageingQuery = usePayablesAgeing();

    const outstanding = (outstandingQuery.data ?? []).filter(
        (r) => r.totalOutstanding > 0,
    );
    const ageing = ageingQuery.data ?? [];

    return (
        <div className="space-y-4">
            <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                    Outstanding by supplier
                </div>
                {!outstandingQuery.isLoading && outstanding.length === 0 ? (
                    <EmptyState
                        title="Nothing outstanding"
                        description="Every supplier bill and opening balance is settled."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        Supplier
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Opening left
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Bills
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Paid
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Outstanding
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {outstanding.map((r) => (
                                    <tr
                                        key={r.supplierId}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-3 py-2.5 text-[13px] text-text-1">
                                            {r.supplierName}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.openingRemaining)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.billsTotal)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.billsPaid)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-text-1">
                                            {formatCurrency(r.totalOutstanding)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border text-[12px] uppercase tracking-wide text-text-3">
                    Ageing — unpaid bills by days overdue
                </div>
                {!ageingQuery.isLoading && ageing.length === 0 ? (
                    <EmptyState
                        title="No unpaid bills"
                        description="Ageing buckets appear once a GRN bill goes past its credit terms."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-2/60 border-b border-border">
                                <tr className="text-[11px] uppercase tracking-wide text-text-3">
                                    <th className="px-3 py-2.5 font-medium">
                                        Supplier
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        Current
                                    </th>
                                    <th className="px-3 py-2.5 font-medium text-right">
                                        1–30d
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
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ageing.map((r) => (
                                    <tr
                                        key={r.supplierId}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-3 py-2.5 text-[13px] text-text-1">
                                            {r.supplierName}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.current)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.d1to30)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-text-2">
                                            {formatCurrency(r.d31to60)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-warning">
                                            {formatCurrency(r.d61to90)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] tabular-nums text-danger">
                                            {formatCurrency(r.d90plus)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right text-[13px] font-semibold tabular-nums text-text-1">
                                            {formatCurrency(r.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
