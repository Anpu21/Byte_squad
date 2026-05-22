import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface PointsEarnedBannerProps {
    pointsEarned: number;
}

export function PointsEarnedBanner({ pointsEarned }: PointsEarnedBannerProps) {
    if (pointsEarned <= 0) return null;

    const label =
        pointsEarned === 1
            ? 'You earned 1 point!'
            : `You earned ${pointsEarned} points!`;

    return (
        <Link
            to={FRONTEND_ROUTES.SHOP_REWARDS}
            className="flex items-center justify-between gap-3 bg-warning-soft text-warning rounded-md px-4 py-3 mb-6 hover:opacity-90 transition-opacity animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
            <span className="flex items-center gap-2">
                <Sparkles size={16} aria-hidden="true" />
                <span className="text-sm font-semibold">{label}</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-medium">
                View your rewards <ArrowRight size={12} />
            </span>
        </Link>
    );
}
