import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { ILoyaltyCustomerRow } from '@/types';
import { useLoyaltyCustomers } from '../hooks/useLoyaltyCustomers';
import { LoyaltyCustomersFilters } from './LoyaltyCustomersFilters';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';

interface LoyaltyCustomersTableProps {
    role: 'admin' | 'manager';
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

function customerFullName(row: ILoyaltyCustomerRow): string {
    return [row.firstName, row.lastName].filter(Boolean).join(' ');
}

export function LoyaltyCustomersTable({
    role,
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
        role,
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

    const columns: DataTableColumn<ILoyaltyCustomerRow>[] = [
        {
            key: 'customer',
            header: 'Customer',
            className: 'text-text-1 font-medium',
            render: (row) => customerFullName(row),
        },
        {
            key: 'contact',
            header: 'Contact',
            className: 'text-text-2 truncate',
            render: (row) => row.email ?? row.phone ?? '—',
        },
        {
            key: 'tier',
            header: 'Tier',
            render: (row) => <LoyaltyTierBadge tier={row.tier} />,
        },
        {
            key: 'balance',
            header: 'Balance',
            align: 'right',
            numeric: true,
            className: 'font-bold text-text-1',
            render: (row) => row.pointsBalance,
        },
        {
            key: 'lifetimeEarned',
            header: 'Lifetime earned',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (row) => row.lifetimePointsEarned,
        },
        {
            key: 'lifetimeRedeemed',
            header: 'Lifetime redeemed',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (row) => row.lifetimePointsRedeemed,
        },
        {
            key: 'lastBranch',
            header: 'Last branch',
            className: 'text-text-2',
            render: (row) => row.lastActivityBranchName ?? '—',
        },
        {
            key: 'lastActivity',
            header: 'Last activity',
            align: 'right',
            className: 'text-text-3 tabular-nums whitespace-nowrap',
            render: (row) => formatLastActivity(row.lastActivityAt),
        },
    ];

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

            <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                isLoading={isLoading}
                zebra
                onRowClick={(row) => onSelectCustomer(row)}
                getRowLabel={(row) =>
                    `View loyalty history for ${customerFullName(row)}`
                }
                empty={
                    <EmptyState
                        title="No loyalty activity yet"
                        description={
                            search ||
                            branchId ||
                            activeSince ||
                            minPoints ||
                            maxPoints
                                ? 'Try a different filter combination.'
                                : 'Customer balances will appear here once they place pickup orders or visit a branch.'
                        }
                    />
                }
                footer={
                    total > PAGE_SIZE ? (
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
                    ) : undefined
                }
            />
        </Card>
    );
}
