import { Link } from 'react-router-dom';
import { LuChevronLeft as ChevronLeft, LuSparkles as Sparkles, LuShoppingBag as ShoppingBag } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useLoyaltySummary } from '@/features/loyalty/hooks/useLoyaltySummary';
import { useLoyaltySettings } from '@/features/loyalty/hooks/useLoyaltySettings';
import { LoyaltyBalanceHero } from '@/features/loyalty/components/LoyaltyBalanceHero';
import { LoyaltyKpis } from '@/features/loyalty/components/LoyaltyKpis';
import { LoyaltyHowItWorks } from '@/features/loyalty/components/LoyaltyHowItWorks';
import { LoyaltyHistoryList } from '@/features/loyalty/components/LoyaltyHistoryList';

export function RewardsPage() {
    const { data, isLoading, isError } = useLoyaltySummary();
    const { data: settings } = useLoyaltySettings();

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

    const canRedeem =
        data.pointsBalance > 0 &&
        data.pointsBalance >= (settings?.minRedeemablePoints ?? 0);

    return (
        <div className="max-w-3xl mx-auto">
            <Link
                to={FRONTEND_ROUTES.SHOP}
                className="inline-flex items-center gap-1 text-sm text-text-2 hover:text-text-1 mb-4"
            >
                <ChevronLeft size={14} /> Back to shop
            </Link>

            <div className="mb-6 flex items-center gap-2">
                <Sparkles size={20} className="text-warning" aria-hidden="true" />
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Rewards
                </h1>
            </div>

            <LoyaltyBalanceHero
                pointsBalance={data.pointsBalance}
                tier={data.tier}
                lifetimePointsEarned={data.lifetimePointsEarned}
                silverTierPoints={settings?.silverTierPoints}
                goldTierPoints={settings?.goldTierPoints}
            />

            {canRedeem && (
                <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary-soft/40 px-4 py-3">
                    <p className="text-sm text-text-1">
                        Redeem your points for up to{' '}
                        <span className="font-semibold">
                            {settings?.redeemCapPercent ?? 20}%
                        </span>{' '}
                        off — applied at checkout.
                    </p>
                    <Link
                        to={FRONTEND_ROUTES.SHOP}
                        className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-text-inv text-sm font-semibold hover:bg-primary-hover transition-colors"
                    >
                        <ShoppingBag size={14} /> Shop now
                    </Link>
                </div>
            )}

            <LoyaltyKpis
                lifetimeEarned={data.lifetimePointsEarned}
                lifetimeRedeemed={data.lifetimePointsRedeemed}
            />
            <LoyaltyHowItWorks />
            <LoyaltyHistoryList />
        </div>
    );
}
