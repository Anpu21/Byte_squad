import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { IGrn } from '@/types';
import { GrnPaymentPill } from '../grns/GrnPaymentPill';

/** Allocation key for a supplier's pre-system opening balance. */
export const OPENING_KEY = 'opening';

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

interface BillAllocationTableProps {
    openBills: IGrn[];
    openingBalance: number;
    openingRemaining: number;
    alloc: Record<string, string>;
    onAllocChange: (key: string, value: string) => void;
}

/**
 * Bill-by-bill "Against Reference" allocation grid: the supplier's unsettled
 * opening balance (if any) plus each open bill, with a "pay now" input per row.
 */
export function BillAllocationTable({
    openBills,
    openingBalance,
    openingRemaining,
    alloc,
    onAllocChange,
}: BillAllocationTableProps) {
    return (
        <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left">
                <thead className="bg-surface-2/60 border-b border-border">
                    <tr className="text-[11px] uppercase tracking-wide text-text-3">
                        <th className="px-3 py-2 font-medium">Bill</th>
                        <th className="px-3 py-2 font-medium">Due</th>
                        <th className="px-3 py-2 font-medium">State</th>
                        <th className="px-3 py-2 font-medium text-right">Total</th>
                        <th className="px-3 py-2 font-medium text-right">
                            Remaining
                        </th>
                        <th className="px-3 py-2 font-medium text-right w-36">
                            Pay now
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {openingRemaining > 0 && (
                        <tr className="border-b border-border bg-surface-2/30">
                            <td className="px-3 py-2 text-[13px] text-text-1 italic">
                                Opening balance
                            </td>
                            <td className="px-3 py-2 text-[12px] text-text-3">
                                —
                            </td>
                            <td className="px-3 py-2 text-[12px] text-text-3">
                                Pre-system
                            </td>
                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                {formatCurrency(openingBalance)}
                            </td>
                            <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                {formatCurrency(openingRemaining)}
                            </td>
                            <td className="px-3 py-2">
                                <input
                                    className={`${INPUT_CLASS} w-full h-8 text-right`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={alloc[OPENING_KEY] ?? ''}
                                    onChange={(e) =>
                                        onAllocChange(OPENING_KEY, e.target.value)
                                    }
                                    aria-label="Pay against opening balance"
                                />
                            </td>
                        </tr>
                    )}
                    {openBills.map((bill) => {
                        const remaining =
                            Number(bill.grandTotal) - Number(bill.paidAmount);
                        return (
                            <tr
                                key={bill.id}
                                className="border-b border-border last:border-b-0"
                            >
                                <td className="px-3 py-2 text-[13px] text-text-1 mono">
                                    {bill.grnNumber}
                                </td>
                                <td className="px-3 py-2 text-[12px] text-text-2 whitespace-nowrap">
                                    {bill.dueDate}
                                </td>
                                <td className="px-3 py-2">
                                    <GrnPaymentPill status={bill.paymentStatus} />
                                </td>
                                <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-2">
                                    {formatCurrency(Number(bill.grandTotal))}
                                </td>
                                <td className="px-3 py-2 text-right text-[13px] tabular-nums text-text-1">
                                    {formatCurrency(remaining)}
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        className={`${INPUT_CLASS} w-full h-8 text-right`}
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={alloc[bill.id] ?? ''}
                                        onChange={(e) =>
                                            onAllocChange(bill.id, e.target.value)
                                        }
                                        aria-label={`Pay against ${bill.grnNumber}`}
                                    />
                                </td>
                            </tr>
                        );
                    })}
                    {openBills.length === 0 && openingRemaining <= 0 && (
                        <tr>
                            <td
                                colSpan={6}
                                className="px-3 py-6 text-center text-sm text-text-3"
                            >
                                Nothing outstanding for this supplier 🎉
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
