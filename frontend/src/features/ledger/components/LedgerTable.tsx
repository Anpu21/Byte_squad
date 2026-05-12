import { BookOpen } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import type { LedgerEntryWithBalance } from '../lib/compute-balance';
import { LedgerRow } from './LedgerRow';

interface LedgerTableProps {
    entries: LedgerEntryWithBalance[];
    isLoading: boolean;
    hasFilters: boolean;
}

export function LedgerTable({ entries, isLoading, hasFilters }: LedgerTableProps) {
    if (isLoading) {
        return (
            <div className="p-6 space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="h-10 bg-surface-2 rounded-md animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <EmptyState
                icon={<BookOpen size={20} />}
                title="No ledger entries found"
                description={
                    hasFilters
                        ? 'No entries match your current filters. Try adjusting your search.'
                        : 'Ledger entries will appear here when POS sales or expenses are recorded.'
                }
            />
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-[11px] uppercase tracking-[0.06em] text-text-3 bg-surface-2 border-b border-border">
                        <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                            Date
                        </th>
                        <th className="px-5 py-2.5 font-semibold whitespace-nowrap">
                            Reference
                        </th>
                        <th className="px-5 py-2.5 font-semibold">
                            Description
                        </th>
                        <th className="px-5 py-2.5 font-semibold text-right">
                            Debit
                        </th>
                        <th className="px-5 py-2.5 font-semibold text-right">
                            Credit
                        </th>
                        <th className="px-5 py-2.5 font-semibold text-right">
                            Balance
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {entries.map((entry) => (
                        <LedgerRow key={entry.id} entry={entry} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
