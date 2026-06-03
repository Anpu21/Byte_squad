import { useLoyaltySettings } from '@/features/loyalty/hooks/useLoyaltySettings';
import type { LoyaltyTier } from '@/types';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';

interface LoyaltyTierProgressProps {
    tier: LoyaltyTier;
    lifetimePoints: number;
}

export function LoyaltyTierProgress({ tier, lifetimePoints }: LoyaltyTierProgressProps) {
    const { data: settings } = useLoyaltySettings();

    if (!settings) return null;

    let nextTier: LoyaltyTier | undefined = undefined;
    let nextThreshold = 0;
    let prevThreshold = 0;

    if (tier === 'bronze') {
        nextTier = 'silver';
        nextThreshold = settings.silverTierPoints;
        prevThreshold = 0;
    } else if (tier === 'silver') {
        nextTier = 'gold';
        nextThreshold = settings.goldTierPoints;
        prevThreshold = settings.silverTierPoints;
    }

    const isMaxTier = !nextTier;

    const progressValue = isMaxTier
        ? 100
        : Math.min(100, Math.max(0, ((lifetimePoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Current:</span>
                    <LoyaltyTierBadge tier={tier} />
                </div>
                {!isMaxTier && nextTier && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <span>Next:</span>
                        <LoyaltyTierBadge tier={nextTier as LoyaltyTier} />
                    </div>
                )}
            </div>

            <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${progressValue}%` }} 
                />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{lifetimePoints.toLocaleString()} pts earned</span>
                {!isMaxTier && (
                    <span>{nextThreshold.toLocaleString()} pts to unlock</span>
                )}
            </div>
        </div>
    );
}
