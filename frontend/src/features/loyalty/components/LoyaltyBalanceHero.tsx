import { Sparkles, Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { LoyaltyTier } from '@/types';

interface LoyaltyBalanceHeroProps {
    pointsBalance: number;
    tier: LoyaltyTier;
    lifetimePointsEarned: number;
    silverTierPoints?: number;
    goldTierPoints?: number;
}

function formatTier(tier: LoyaltyTier): string {
    return tier === 'gold' ? 'Gold' : tier === 'silver' ? 'Silver' : 'Bronze';
}

export function LoyaltyBalanceHero({
    pointsBalance,
    tier,
    lifetimePointsEarned,
    silverTierPoints,
    goldTierPoints,
}: LoyaltyBalanceHeroProps) {
    // Progress toward the next tier, measured on lifetime earned points.
    const silver = silverTierPoints ?? 0;
    const gold = goldTierPoints ?? 0;
    let nextLabel: string | null = null;
    let target = 0;
    let floor = 0;
    if (tier === 'bronze' && silver > 0) {
        nextLabel = 'Silver';
        target = silver;
    } else if (tier === 'silver' && gold > silver) {
        nextLabel = 'Gold';
        target = gold;
        floor = silver;
    }

    const span = Math.max(1, target - floor);
    const progressed = Math.min(span, Math.max(0, lifetimePointsEarned - floor));
    const pct = nextLabel ? Math.min(100, Math.round((progressed / span) * 100)) : 100;
    const remaining = nextLabel ? Math.max(0, target - lifetimePointsEarned) : 0;

    return (
        <section className="rounded-lg border border-warning/30 bg-gradient-to-br from-warning-soft to-surface p-6 md:p-8 mb-6">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-warning">
                {tier === 'gold' ? (
                    <Crown size={14} aria-hidden="true" />
                ) : (
                    <Sparkles size={14} aria-hidden="true" />
                )}
                {formatTier(tier)} member
            </p>

            <div className="mt-3 flex items-end gap-2">
                <p className="text-4xl md:text-5xl font-bold tracking-tight text-text-1">
                    {pointsBalance}
                </p>
                <span className="mb-1 text-base font-medium text-text-2">
                    {pointsBalance === 1 ? 'point' : 'points'}
                </span>
            </div>
            <p className="mt-1 text-sm text-text-2">
                Worth up to {formatCurrency(pointsBalance)} off your next order
            </p>

            {nextLabel ? (
                <div className="mt-5">
                    <div className="flex items-center justify-between text-xs text-text-2 mb-1.5">
                        <span>Progress to {nextLabel}</span>
                        <span className="tabular-nums">{remaining} pts to go</span>
                    </div>
                    <div
                        className="h-2 rounded-full bg-surface-2 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progress to ${nextLabel} tier`}
                    >
                        <div
                            className="h-full rounded-full bg-warning transition-all"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>
            ) : (
                <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-warning">
                    <Crown size={14} aria-hidden="true" />
                    You&apos;ve reached our top tier — enjoy the perks!
                </p>
            )}
        </section>
    );
}
