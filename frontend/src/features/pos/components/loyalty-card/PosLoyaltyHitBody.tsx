import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

export interface IPosLoyaltyHitBodyProps {
    owner: IPosLoyaltyOwner;
    redeemPoints: number;
    onRedeemChange: (next: number) => void;
    /**
     * Server-mirrored redeem cap (subtotal-scaled, computed by
     * `sizeLoyaltyRedeem`). Falls back to the wallet balance when the
     * caller hasn't sized it yet (e.g. before settings load).
     */
    maxRedeemable?: number;
}

/**
 * Renders the "hit" state of the loyalty card — name + tier label,
 * point balance, and a redeem-points input clamped to the server-mirrored
 * redeem cap so the cashier can't request more than the bill actually
 * settles. The backend re-caps authoritatively on submit.
 */
export function PosLoyaltyHitBody({
    owner,
    redeemPoints,
    onRedeemChange,
    maxRedeemable,
}: IPosLoyaltyHitBodyProps) {
    const redeemCap = maxRedeemable ?? Math.max(0, owner.pointsBalance);
    const tierLabel =
        owner.tier === 'gold'
            ? 'Gold'
            : owner.tier === 'silver'
              ? 'Silver'
              : 'Bronze';
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-text-1">
                        {owner.firstName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-text-3">
                        {tierLabel} ·{' '}
                        {owner.ownerType === 'user' ? 'Registered' : 'Walk-in'}
                    </span>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] uppercase tracking-wide text-text-3">
                        Balance
                    </span>
                    <span className="text-[18px] font-bold tabular-nums text-primary">
                        {owner.pointsBalance.toLocaleString()}
                    </span>
                    <span className="ml-1 text-[11px] text-text-2">pts</span>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3">
                <span className="text-[12px] text-text-2">Redeem points</span>
                <div className="flex flex-col items-end">
                    <PosCartNumericCell
                        value={redeemPoints}
                        onCommit={onRedeemChange}
                        min={0}
                        max={redeemCap}
                        ariaLabel="Redeem points"
                        className={cn(FIELD_SHELL, FIELD_BORDER, 'w-24 h-8 px-2 text-right text-[12px] tabular-nums')}
                    />
                    <span className="mt-1 text-[10px] text-text-3">
                        Redeem up to {redeemCap.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
