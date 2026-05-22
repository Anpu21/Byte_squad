import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { ILoyaltyCustomerRow } from '@/types';
import { useLoyaltyCustomers } from '../hooks/useLoyaltyCustomers';

interface LoyaltyCustomersTableProps {
    onSelectCustomer: (row: ILoyaltyCustomerRow) => void;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

function formatLastActivity(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function LoyaltyCustomersTable({
    onSelectCustomer,
}: LoyaltyCustomersTableProps) {
    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchDraft.trim());
            setOffset(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchDraft]);

    const { data, isLoading } = useLoyaltyCustomers({
        search: search || undefined,
        limit: PAGE_SIZE,
        offset,
    });

    const rows = data?.rows ?? [];
    const total = data?.total ?? 0;
    const pageStart = total === 0 ? 0 : offset + 1;
    const pageEnd = Math.min(total, offset + rows.length);

    return (
        <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center gap-3">
                <div className="relative flex-1 max-w-[360px]">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                    />
                    <input
                        type="text"
                        value={searchDraft}
                        onChange={(e) => setSearchDraft(e.target.value)}
                        placeholder="Search by name or email…"
                        aria-label="Search loyalty customers"
                        className="w-full h-9 pl-9 pr-9 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors"
                    />
                    {searchDraft && (
                        <button
                            type="button"
                            onClick={() => setSearchDraft('')}
                            aria-label="Clear search"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-3 hover:text-text-1"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
                <p className="ml-auto text-[11px] text-text-3 tabular-nums">
                    {total === 0
                        ? 'No customers'
                        : `${pageStart}–${pageEnd} of ${total}`}
                </p>
            </div>

            {rows.length === 0 && !isLoading ? (
                <EmptyState
                    title="No loyalty activity yet"
                    description={
                        search
                            ? 'Try a different search.'
                            : 'Customer balances will appear here once they place pickup orders.'
                    }
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2">
                                <th className="px-5 py-2.5 font-semibold">
                                    Customer
                                </th>
                                <th className="px-5 py-2.5 font-semibold">
                                    Email
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Balance
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Lifetime earned
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Lifetime redeemed
                                </th>
                                <th className="px-5 py-2.5 font-semibold text-right">
                                    Last activity
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => onSelectCustomer(row)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`View loyalty history for ${row.firstName} ${row.lastName}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            onSelectCustomer(row);
                                        }
                                    }}
                                    className="border-t border-border hover:bg-surface-2/40 cursor-pointer transition-colors focus:outline-none focus:bg-surface-2/40 focus:ring-2 focus:ring-inset focus:ring-primary/30"
                                >
                                    <td className="px-5 py-3 text-[13px] text-text-1 font-medium">
                                        {row.firstName} {row.lastName}
                                    </td>
                                    <td className="px-5 py-3 text-[12px] text-text-2 truncate">
                                        {row.email}
                                    </td>
                                    <td className="px-5 py-3 text-right mono tabular-nums text-[13px] font-bold text-text-1">
                                        {row.pointsBalance}
                                    </td>
                                    <td className="px-5 py-3 text-right mono tabular-nums text-[12px] text-text-2">
                                        {row.lifetimePointsEarned}
                                    </td>
                                    <td className="px-5 py-3 text-right mono tabular-nums text-[12px] text-text-2">
                                        {row.lifetimePointsRedeemed}
                                    </td>
                                    <td className="px-5 py-3 text-right text-[12px] text-text-3 tabular-nums whitespace-nowrap">
                                        {formatLastActivity(row.lastActivityAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {total > PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-2/30">
                    <button
                        type="button"
                        disabled={offset === 0}
                        onClick={() =>
                            setOffset((o) => Math.max(0, o - PAGE_SIZE))
                        }
                        className="h-8 px-3 rounded-md border border-border text-[12px] font-semibold text-text-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        disabled={offset + PAGE_SIZE >= total}
                        onClick={() => setOffset((o) => o + PAGE_SIZE)}
                        className="h-8 px-3 rounded-md border border-border text-[12px] font-semibold text-text-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-2"
                    >
                        Next
                    </button>
                </div>
            )}
        </Card>
    );
}
