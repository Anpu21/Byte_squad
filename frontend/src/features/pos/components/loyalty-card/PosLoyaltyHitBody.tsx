import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';

export interface IPosLoyaltyHitBodyProps {
    owner: IPosLoyaltyOwner;
    redeemPoints: number;
    onRedeemChange: (next: number) => void;
}

/**
 * Renders the "hit" state of the loyalty card — name + tier label,
 * point balance, and a redeem-points input clamped to the wallet
 * balance. Backend enforces the precise redeem cap (subtotal-scaled);
 * the FE just guards against redeeming more than is in the wallet.
 */
export function PosLoyaltyHitBody({
    owner,
    redeemPoints,
    onRedeemChange,
}: IPosLoyaltyHitBodyProps) {
    const maxRedeemable = Math.max(0, owner.pointsBalance);
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
                        max={maxRedeemable}
                        ariaLabel="Redeem points"
                        className="w-24 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                    />
                    <span className="mt-1 text-[10px] text-text-3">
                        Redeem up to {maxRedeemable.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
