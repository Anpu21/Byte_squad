import { Users, Coins, TrendingUp, Gift } from 'lucide-react';
import { useLoyaltyDashboard } from '../hooks/useLoyaltyDashboard';
import KpiCard from '@/components/ui/KpiCard';

interface LoyaltyDashboardKpisProps {
    role: 'admin' | 'manager';
}

export function LoyaltyDashboardKpis({ role }: LoyaltyDashboardKpisProps) {
    const { data, isLoading, error } = useLoyaltyDashboard(role);

    if (error) {
        return <div className="text-destructive mb-6">Failed to load dashboard stats</div>;
    }

    if (isLoading || !data) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 bg-surface border border-border rounded-md shadow-xs p-5 h-[104px] animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
                label="Total Members"
                value={data.totalMembers.toLocaleString()}
                icon={<Users className="w-4 h-4 opacity-70" />}
            />
            <KpiCard
                label="Total Points"
                value={data.totalPointsInCirculation.toLocaleString()}
                icon={<Coins className="w-4 h-4 opacity-70" />}
            />
            <KpiCard
                label="Earned (This Month)"
                value={`+${data.pointsEarnedThisMonth.toLocaleString()}`}
                icon={<TrendingUp className="w-4 h-4 text-primary" />}
            />
            <KpiCard
                label="Redeemed (This Month)"
                value={`-${data.pointsRedeemedThisMonth.toLocaleString()}`}
                icon={<Gift className="w-4 h-4 text-danger" />}
            />
        </div>
    );
}
