import { Link } from 'react-router-dom';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useLoyaltySummary } from '@/features/loyalty/hooks/useLoyaltySummary';
import { LoyaltyBalanceHero } from '@/features/loyalty/components/LoyaltyBalanceHero';
import { LoyaltyKpis } from '@/features/loyalty/components/LoyaltyKpis';
import { LoyaltyHowItWorks } from '@/features/loyalty/components/LoyaltyHowItWorks';
import { LoyaltyHistoryList } from '@/features/loyalty/components/LoyaltyHistoryList';

export function RewardsPage() {
    const { data, isLoading, isError } = useLoyaltySummary();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <p className="text-sm text-danger">
                    Could not load your rewards. Try again later.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ChevronLeft size={14} /> Back to shop
            </Link>

            <div className="mb-6 flex items-center gap-2">
                <Sparkles
                    size={20}
                    className="text-warning"
                    aria-hidden="true"
                />
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Rewards
                </h1>
            </div>

            <LoyaltyBalanceHero pointsBalance={data.pointsBalance} />
            <LoyaltyKpis
                lifetimeEarned={data.lifetimePointsEarned}
                lifetimeRedeemed={data.lifetimePointsRedeemed}
            />
            <LoyaltyHowItWorks />
            <LoyaltyHistoryList />
        </div>
    );
}
