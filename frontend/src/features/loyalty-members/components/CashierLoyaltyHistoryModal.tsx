import Modal from '@/components/ui/Modal';
import type { ILoyaltyCustomerRow } from '@/types';
import { LoyaltyTierBadge } from '@/features/admin-loyalty/components/LoyaltyTierBadge';
import { LoyaltyHistoryRow } from '@/features/loyalty/components/LoyaltyHistoryRow';
import { useLoyaltyMemberHistory } from '../hooks/useLoyaltyMemberHistory';

interface CashierLoyaltyHistoryModalProps {
    member: ILoyaltyCustomerRow | null;
    onClose: () => void;
}

function memberName(member: ILoyaltyCustomerRow): string {
    return [member.firstName, member.lastName].filter(Boolean).join(' ');
}

/**
 * Points-history modal opened from the loyalty-members table: a balance/tier
 * summary plus the member's ledger (reusing the customer-facing
 * `LoyaltyHistoryRow`). Read-only — the cashier browses, redemption happens
 * at the POS card.
 */
export function CashierLoyaltyHistoryModal({
    member,
    onClose,
}: CashierLoyaltyHistoryModalProps) {
    const history = useLoyaltyMemberHistory(member?.id ?? null);
    const entries = history.data?.entries ?? [];

    return (
        <Modal
            isOpen={member !== null}
            onClose={onClose}
            title={
                member ? `${memberName(member)} — points history` : 'Points history'
            }
            maxWidth="lg"
        >
            {!member ? null : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 p-3">
                        <div className="flex flex-col gap-1.5">
                            <LoyaltyTierBadge tier={member.tier} />
                            <span className="text-[11px] text-text-3">
                                Lifetime earned{' '}
                                {member.lifetimePointsEarned.toLocaleString()} ·
                                redeemed{' '}
                                {member.lifetimePointsRedeemed.toLocaleString()}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] uppercase tracking-wide text-text-3">
                                Balance
                            </span>
                            <span className="text-[20px] font-bold tabular-nums text-primary">
                                {member.pointsBalance.toLocaleString()}
                            </span>
                            <span className="ml-1 text-[11px] text-text-2">
                                pts
                            </span>
                        </div>
                    </div>

                    {history.isLoading ? (
                        <p className="py-6 text-center text-sm text-text-2">
                            Loading…
                        </p>
                    ) : history.isError ? (
                        <p className="py-6 text-center text-sm text-danger">
                            Could not load points history.
                        </p>
                    ) : entries.length === 0 ? (
                        <p className="py-6 text-center text-sm text-text-3">
                            No points activity yet.
                        </p>
                    ) : (
                        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border px-4">
                            {entries.map((entry) => (
                                <LoyaltyHistoryRow key={entry.id} entry={entry} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
