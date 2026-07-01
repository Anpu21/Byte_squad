import {
    Button,
    DataTable,
    EmptyState,
    type DataTableColumn,
} from '@/components/ui';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltyTierBadge } from '@/features/admin-loyalty/components/LoyaltyTierBadge';

interface LoyaltyMembersTableProps {
    rows: ILoyaltyCustomerRow[];
    isLoading: boolean;
    onOpenHistory: (row: ILoyaltyCustomerRow) => void;
}

function memberName(r: ILoyaltyCustomerRow): string {
    return [r.firstName, r.lastName].filter(Boolean).join(' ');
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString();
}

/** Branch loyalty members with tier, balances, and a points-history action. */
export function LoyaltyMembersTable({
    rows,
    isLoading,
    onOpenHistory,
}: LoyaltyMembersTableProps) {
    const columns: DataTableColumn<ILoyaltyCustomerRow>[] = [
        {
            key: 'member',
            header: 'Member',
            className: 'font-medium',
            render: (r) => (
                <div className="flex flex-col">
                    <span>{memberName(r)}</span>
                    <span className="text-[11px] text-text-3">
                        {r.phone ?? r.email ?? '—'}
                    </span>
                </div>
            ),
        },
        {
            key: 'tier',
            header: 'Tier',
            render: (r) => <LoyaltyTierBadge tier={r.tier} />,
        },
        {
            key: 'balance',
            header: 'Points',
            align: 'right',
            numeric: true,
            className: 'font-semibold',
            render: (r) => r.pointsBalance.toLocaleString(),
        },
        {
            key: 'earned',
            header: 'Lifetime earned',
            align: 'right',
            numeric: true,
            className: 'text-text-2',
            render: (r) => r.lifetimePointsEarned.toLocaleString(),
        },
        {
            key: 'activity',
            header: 'Last activity',
            className: 'text-text-2',
            render: (r) => formatDate(r.lastActivityAt),
        },
        {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (r) => (
                <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onOpenHistory(r)}
                >
                    History
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.id}
            isLoading={isLoading}
            zebra
            clientPaginate={{ unit: 'members' }}
            empty={
                <EmptyState
                    title="No loyalty members yet"
                    description="Enrolled members and anyone who has earned points in your branch appear here."
                />
            }
        />
    );
}
