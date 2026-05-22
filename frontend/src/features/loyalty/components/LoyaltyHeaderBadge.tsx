import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useLoyaltySummary } from '../hooks/useLoyaltySummary';

export function LoyaltyHeaderBadge() {
    const { data, isLoading, isError } = useLoyaltySummary();

    if (isLoading || isError || !data) return null;

    const hasNoActivity =
        data.pointsBalance === 0 &&
        data.lifetimePointsEarned === 0 &&
        data.lifetimePointsRedeemed === 0;

    const label = hasNoActivity ? 'Earn rewards' : `${data.pointsBalance} pts`;
    const ariaLabel = hasNoActivity
        ? 'Loyalty rewards — earn points on every order'
        : `Loyalty points: ${data.pointsBalance}`;

    return (
        <Link
            to={FRONTEND_ROUTES.SHOP_REWARDS}
            aria-label={ariaLabel}
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 text-[13px] font-medium rounded-full bg-warning-soft text-warning hover:opacity-90 transition-opacity"
        >
            <Sparkles size={14} />
            <span>{label}</span>
        </Link>
    );
}
