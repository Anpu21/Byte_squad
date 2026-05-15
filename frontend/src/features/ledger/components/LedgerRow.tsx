import { formatCurrency } from '@/lib/utils';
import type { LedgerEntryWithBalance } from '../lib/compute-balance';

interface LedgerRowProps {
    entry: LedgerEntryWithBalance;
}

export function LedgerRow({ entry }: LedgerRowProps) {
    const dateLabel = new Date(entry.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
    return (
        <tr className="border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors">
            <td className="px-5 py-3 mono text-xs text-text-2 whitespace-nowrap">
                {dateLabel}
            </td>
            <td className="px-5 py-3 mono text-xs text-text-1">
                {entry.referenceNumber}
            </td>
            <td className="px-5 py-3 text-[13px] text-text-1 whitespace-nowrap">
                {entry.branch?.name ?? entry.branchId}
            </td>
            <td className="px-5 py-3 text-[13px] text-text-1">
                {entry.description}
            </td>
            <td className="px-5 py-3 mono text-[13px] text-right">
                {entry.entryType === 'debit' ? (
                    <span className="text-text-1 font-medium">
                        {formatCurrency(Number(entry.amount))}
                    </span>
                ) : (
                    <span className="text-text-3">—</span>
                )}
            </td>
            <td className="px-5 py-3 mono text-[13px] text-right">
                {entry.entryType === 'credit' ? (
                    <span className="text-accent-text font-medium">
                        {formatCurrency(Number(entry.amount))}
                    </span>
                ) : (
                    <span className="text-text-3">—</span>
                )}
            </td>
            <td
                className={`px-5 py-3 mono text-[13px] font-semibold text-right ${
                    entry.balance >= 0 ? 'text-text-1' : 'text-danger'
                }`}
            >
                {formatCurrency(entry.balance)}
            </td>
        </tr>
    );
}
