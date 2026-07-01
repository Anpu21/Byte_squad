import { useMemo, useState } from 'react';
import { LuSearch as Search, LuUserPlus as UserPlus } from 'react-icons/lu';
import { Button, Input } from '@/components/ui';
import Card from '@/components/ui/Card';
import type { ILoyaltyCustomerRow } from '@/types';
import { useLoyaltyBranchMembers } from './hooks/useLoyaltyBranchMembers';
import { LoyaltyMembersTable } from './components/LoyaltyMembersTable';
import { CashierLoyaltyHistoryModal } from './components/CashierLoyaltyHistoryModal';
import { CashierLoyaltyEnrollModal } from './components/CashierLoyaltyEnrollModal';

/**
 * Cashier-facing loyalty counter — the sibling of the store-credit page. Lists
 * every loyalty member in the cashier's branch (server-scoped: homed there or
 * with branch ledger activity); the search box filters it in place. A row's
 * History action opens the member's points ledger; Enrol member adds a walk-in
 * who then earns on their next sale.
 */
export function CashierLoyaltyPage() {
    const membersQuery = useLoyaltyBranchMembers();
    const rows = useMemo(
        () => membersQuery.data?.rows ?? [],
        [membersQuery.data],
    );

    const [query, setQuery] = useState('');
    const [historyMember, setHistoryMember] =
        useState<ILoyaltyCustomerRow | null>(null);
    const [enrollOpen, setEnrollOpen] = useState(false);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter(
            (r) =>
                r.firstName.toLowerCase().includes(term) ||
                (r.lastName?.toLowerCase().includes(term) ?? false) ||
                (r.phone?.toLowerCase().includes(term) ?? false),
        );
    }, [rows, query]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1">
                        Loyalty members
                    </h1>
                    <p className="text-xs text-text-2 mt-1">
                        Every loyalty member in your branch. Search to find one,
                        open their points history, or enrol a new walk-in.
                    </p>
                </div>
                <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setEnrollOpen(true)}
                >
                    <UserPlus size={16} aria-hidden /> Enrol member
                </Button>
            </div>

            {/* Search filters the table in place */}
            <div className="mb-4 max-w-sm">
                <Input
                    type="search"
                    label="Search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name or phone"
                    autoComplete="off"
                    leftIcon={<Search size={16} aria-hidden />}
                />
            </div>

            <Card className="overflow-hidden">
                <LoyaltyMembersTable
                    rows={filtered}
                    isLoading={membersQuery.isLoading}
                    onOpenHistory={(r) => setHistoryMember(r)}
                />
            </Card>

            <CashierLoyaltyHistoryModal
                member={historyMember}
                onClose={() => setHistoryMember(null)}
            />
            <CashierLoyaltyEnrollModal
                isOpen={enrollOpen}
                onClose={() => setEnrollOpen(false)}
            />
        </div>
    );
}
