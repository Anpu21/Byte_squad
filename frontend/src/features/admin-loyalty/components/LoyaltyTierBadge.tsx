import { LuAward as Award, LuShield as Shield, LuCrown as Crown } from 'react-icons/lu';
import type { LoyaltyTier } from '@/types';
import { cn } from '@/lib/utils';

interface LoyaltyTierBadgeProps {
    tier: LoyaltyTier;
    className?: string;
}

export function LoyaltyTierBadge({ tier, className }: LoyaltyTierBadgeProps) {
    switch (tier) {
        case 'bronze':
            return (
                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200", className)}>
                    <Shield className="w-3.5 h-3.5" />
                    Bronze
                </div>
            );
        case 'silver':
            return (
                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200", className)}>
                    <Award className="w-3.5 h-3.5" />
                    Silver
                </div>
            );
        case 'gold':
            return (
                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300", className)}>
                    <Crown className="w-3.5 h-3.5" />
                    Gold
                </div>
            );
    }
}
