import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import type { ILoyaltyCustomerRow } from '@/types';
import { useLoyaltyCustomers } from '../hooks/useLoyaltyCustomers';
import { LoyaltyCustomersFilters } from './LoyaltyCustomersFilters';

interface LoyaltyCustomersTableProps {
    onSelectCustomer: (row: ILoyaltyCustomerRow) => void;
}

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 250;

function formatLastActivity(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function parsePointsInput(raw: string): number | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function LoyaltyCustomersTable({
    onSelectCustomer,
}: LoyaltyCustomersTableProps) {
    const [searchDraft, setSearchDraft] = useState('');
    const [search, setSearch] = useState('');
    const [branchId, setBranchId] = useState('');
    const [activeSince, setActiveSince] = useState('');
    const [minPoints, setMinPoints] = useState('');
    const [maxPoints, setMaxPoints] = useState('');
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchDraft.trim());
            setOffset(0);
        }, SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [searchDraft]);

    // Filter changes reset pagination via setter wrappers so the table
    // jumps back to page 1 the moment the admin narrows the query.
    function handleBranchIdChange(next: string) {
        setBranchId(next);
        setOffset(0);
    }
    function handleActiveSinceChange(next: string) {
        setActiveSince(next);
        setOffset(0);
    }
    function handlePointsRangeChange(min: string, max: string) {
        setMinPoints(min);
        setMaxPoints(max);
        setOffset(0);
    }

    const { data, isLoading } = useLoyaltyCustomers({
        search: search || undefined,
        branchId: branchId || undefined,
        activeSince: activeSince || undefined,
        minPoints: parsePointsInput(minPoints),
        maxPoints: parsePointsInput(maxPoints),
        limit: PAGE_SIZE,
        offset,
    });

    const rows = data?.rows ?? [];
    const total = data?.total ?? 0;
    const pageStart = total === 0 ? 0 : offset + 1;
    const pageEnd = Math.min(total, offset + rows.length);

    return (
        <Card className="overflow-hidden">
            <LoyaltyCustomersFilters
                searchDraft={searchDraft}
                onSearchDraftChange={setSearchDraft}
                branchId={branchId}
                onBranchIdChange={handleBranchIdChange}
                activeSince={activeSince}
                onActiveSinceChange={handleActiveSinceChange}
                minPoints={minPoints}
                maxPoints={maxPoints}
                onPointsRangeChange={handlePointsRangeChange}
            />
            <div className="px-5 py-2 border-b border-border bg-surface-2/30 flex items-center justify-end">
                <p className="text-[11px] text-text-3 tabular-nums">
                    {total === 0
                        ? 'No customers'
                        : `${pageStart}–${pageEnd} of ${total}`}
                </p>
            </div>

            {rows.length === 0 && !isLoading ? (
                <EmptyState
                    title="No loyalty activity yet"
                    description={
                        search || branchId || activeSince || minPoints || maxPoints
                            ? 'Try a different filter combination.'
                            : 'Customer balances will appear here once they place pickup orders or visit a branch.'
                    }
                />
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[11px] uppercase tracking-[0.08em] text-text-3 bg-surface-2">
                                <th className="px-5 py-2.5 font-semibold">Customer</th>
                                <th className="px-5 py-2.5 font-semibold">Contact</th>
                                <th className="px-5 py-2.5 font-semibold text-right">Balance</th>
                                <th className="px-5 py-2.5 font-semibold text-right">Lifetime earned</th>
                                <th className="px-5 py-2.5 font-semibold text-right">Lifetime redeemed</th>
                                <th className="px-5 py-2.5 font-semibold">Last branch</th>
                                <th className="px-5 py-2.5 font-semibold text-right">Last activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const fullName = [row.firstName, row.lastName]
                                    .filter(Boolean)
                                    .join(' ');
                                return (
                                    <tr
                                        key={row.id}
                                        onClick={() => onSelectCustomer(row)}
                                        tabIndex={0}
                                        role="button"
                                        aria-label={`View loyalty history for ${fullName}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onSelectCustomer(row);
                                            }
                                        }}
                                        className="border-t border-border hover:bg-surface-2/40 cursor-pointer transition-colors focus:outline-none focus:bg-surface-2/40 focus:ring-2 focus:ring-inset focus:ring-primary/30"
                                    >
                                        <td className="px-5 py-3 text-[13px] text-text-1 font-medium">
                                            {fullName}
                                        </td>
                                        <td className="px-5 py-3 text-[12px] text-text-2 truncate">
                                            {row.email ?? row.phone ?? '—'}
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
                                        <td className="px-5 py-3 text-[12px] text-text-2">
                                            {row.lastActivityBranchName ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-right text-[12px] text-text-3 tabular-nums whitespace-nowrap">
                                            {formatLastActivity(row.lastActivityAt)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {total > PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface-2/30">
                    <button
                        type="button"
                        disabled={offset === 0}
                        onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
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
