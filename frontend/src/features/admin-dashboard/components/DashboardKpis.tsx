import {
    AlertTriangle,
    Receipt,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import { formatRevenue } from '../lib/format';

interface DashboardKpisProps {
    todayRevenue: number;
    todayCount: number;
    monthTransactionCount: number;
    avgOrderValue: number;
    activeProducts: number;
    lowStockCount: number;
    sparkline: number[];
}

export function DashboardKpis({
    todayRevenue,
    todayCount,
    monthTransactionCount,
    avgOrderValue,
    activeProducts,
    lowStockCount,
    sparkline,
}: DashboardKpisProps) {
    const safeSparkline = sparkline.length >= 2 ? sparkline : [1, 2, 3, 4];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard
                label="Today's revenue"
                value={formatRevenue(todayRevenue)}
                delta={`${todayCount} transactions`}
                sparkData={safeSparkline}
                sparkColor="var(--accent)"
                icon={<TrendingUp size={14} />}
            />
            <KpiCard
                label="Transactions"
                value={String(todayCount)}
                delta={`${monthTransactionCount} this month`}
                sparkColor="var(--primary)"
                sparkData={safeSparkline}
                icon={<Receipt size={14} />}
            />
            <KpiCard
                label="Avg order value"
                value={formatRevenue(avgOrderValue)}
                delta={`${activeProducts} active products`}
                sparkColor="var(--brand-400)"
                sparkData={[3, 5, 4, 6, 5, 7]}
                icon={<ShoppingCart size={14} />}
            />
            <KpiCard
                label="Low stock items"
                value={String(lowStockCount)}
                delta={
                    lowStockCount > 0
                        ? 'Requires attention'
                        : 'All branches stocked'
                }
                deltaPositive={lowStockCount === 0}
                sparkColor="var(--warning)"
                sparkData={[2, 3, 3, 4, 4, 5]}
                icon={<AlertTriangle size={14} />}
            />
        </div>
    );
}
