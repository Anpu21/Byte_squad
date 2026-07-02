import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import {
    DataTable,
    EmptyState,
    Pagination,
    type DataTableColumn,
} from '@/components/ui';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import type { ILoyaltyCustomerRow } from '@/types';
import { useLoyaltyCustomers } from '../hooks/useLoyaltyCustomers';
import { LoyaltyCustomersFilters } from './LoyaltyCustomersFilters';
import { LoyaltyExportButtons } from './LoyaltyExportButtons';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';

interface LoyaltyCustomersTableProps {
    role: 'admin' | 'manager';
    onSelectCustomer: (row: ILoyaltyCustomerRow) => void;
}

const PAGE_SIZE = DEFAULT_PAGE_SIZE;
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
    const page = Math.floor(offset / PAGE_SIZE) + 1;

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
                trailing={
                    <LoyaltyExportButtons data={rows} disabled={isLoading} />
                }
            />
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
                    total > 0 ? (
                        <Pagination
                            page={page}
                            pageSize={PAGE_SIZE}
                            total={total}
                            onPageChange={(p) => setOffset((p - 1) * PAGE_SIZE)}
                            unit="customers"
                        />
                    ) : undefined
                }
            />
        </Card>
    );
}
