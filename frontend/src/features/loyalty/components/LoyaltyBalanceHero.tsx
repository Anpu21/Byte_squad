import { Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LoyaltyBalanceHeroProps {
    pointsBalance: number;
}

export function LoyaltyBalanceHero({ pointsBalance }: LoyaltyBalanceHeroProps) {
    return (
        <section className="bg-warning-soft text-warning rounded-lg p-6 md:p-8 mb-6">
            <p className="text-xs uppercase tracking-widest opacity-80">
                Available balance
            </p>
            <div className="mt-2 flex items-center gap-3">
                <Sparkles size={28} aria-hidden="true" />
                <p className="text-4xl md:text-5xl font-bold tracking-tight">
                    {pointsBalance}
                </p>
                <span className="text-base md:text-lg font-medium opacity-90">
                    {pointsBalance === 1 ? 'point' : 'points'}
                </span>
            </div>
            <p className="mt-3 text-sm opacity-90">
                Worth up to {formatCurrency(pointsBalance)} off your next order
            </p>
        </section>
    );
}
