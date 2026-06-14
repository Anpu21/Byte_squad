import Button from '@/components/ui/Button';
import Pill from '@/components/ui/Pill';
import EmptyState from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils';
import type { IGrn } from '@/types';
import { GrnPaymentPill } from './GrnPaymentPill';

interface IGrnsTableProps {
    rows: IGrn[];
    isLoading: boolean;
    onView: (grn: IGrn) => void;
}

/** GRN register — goods receipts with bill/payment state at a glance. */
export function GrnsTable({ rows, isLoading, onView }: IGrnsTableProps) {
    if (!isLoading && rows.length === 0) {
        return (
            <EmptyState
                title="No goods receipts yet"
                description="Receive your first delivery from the New GRN tab — stock, cost, and the supplier bill are recorded in one step."
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2.5 font-medium">GRN #</th>
                        <th className="px-3 py-2.5 font-medium">Date</th>
                        <th className="px-3 py-2.5 font-medium">Supplier</th>
                        <th className="px-3 py-2.5 font-medium">Branch</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Total
                        </th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Paid
                        </th>
                        <th className="px-3 py-2.5 font-medium">Payment</th>
                        <th className="px-3 py-2.5 font-medium">Status</th>
                        <th className="px-3 py-2.5 font-medium text-right">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((grn) => (
                        <tr
                            key={grn.id}
                            className="border-b border-border hover:bg-surface-2/40 transition-colors"
                        >
                            <td className="px-3 py-2.5 text-[13px] font-medium text-text-1 mono">
                                {grn.grnNumber}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 whitespace-nowrap">
                                {grn.grnDate}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-1">
                                {grn.supplier?.name ?? '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2">
                                {grn.branch?.name ?? '—'}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-1 text-right tabular-nums">
                                {formatCurrency(Number(grn.grandTotal))}
                            </td>
                            <td className="px-3 py-2.5 text-[13px] text-text-2 text-right tabular-nums">
                                {formatCurrency(Number(grn.paidAmount))}
                            </td>
                            <td className="px-3 py-2.5">
                                <GrnPaymentPill status={grn.paymentStatus} />
                            </td>
                            <td className="px-3 py-2.5">
                                <Pill
                                    tone={
                                        grn.status === 'Received'
                                            ? 'info'
                                            : 'neutral'
                                    }
                                >
                                    {grn.status}
                                </Pill>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => onView(grn)}
                                >
                                    View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
