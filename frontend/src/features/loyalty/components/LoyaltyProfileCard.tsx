import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useLoyaltySummary } from '../hooks/useLoyaltySummary';
import { useLoyaltySettings } from '../hooks/useLoyaltySettings';
import {
    formatEarnRule,
    formatPointValueRule,
    formatRedeemCapRule,
} from '../lib/format-loyalty-rules';

export function LoyaltyProfileCard() {
    const { data, isLoading, isError } = useLoyaltySummary();
    const { data: settings } = useLoyaltySettings();

    if (isLoading || isError || !data) return null;

    return (
        <section className="bg-surface border border-border rounded-md p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-base font-semibold text-text-1">
                    Loyalty rewards
                </h2>
                <Link
                    to={FRONTEND_ROUTES.SHOP_REWARDS}
                    className="text-xs font-medium text-primary hover:opacity-80 inline-flex items-center gap-1"
                >
                    View activity <ArrowRight size={12} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] gap-5">
                <div className="bg-warning-soft text-warning rounded-md p-4 flex flex-col items-center justify-center text-center">
                    <Sparkles size={20} aria-hidden="true" />
                    <p className="text-2xl font-bold mt-2">
                        {data.pointsBalance}
                    </p>
                    <p className="text-xs uppercase tracking-widest mt-1">
                        points
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm text-text-2">
                            Lifetime earned
                        </span>
                        <span className="text-sm font-semibold text-text-1">
                            {data.lifetimePointsEarned}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <span className="text-sm text-text-2">
                            Lifetime redeemed
                        </span>
                        <span className="text-sm font-semibold text-text-1">
                            {data.lifetimePointsRedeemed}
                        </span>
                    </div>
                    <div className="pt-3 mt-2 border-t border-border space-y-1.5 text-xs text-text-2">
                        <p className="text-[11px] uppercase tracking-widest text-text-3">
                            How it works
                        </p>
                        <p>&bull; {formatEarnRule(settings)}</p>
                        <p>&bull; {formatPointValueRule(settings)}</p>
                        <p>&bull; {formatRedeemCapRule(settings)}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
