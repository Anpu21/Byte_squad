import KpiCard from '@/components/ui/KpiCard';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface BranchKpiStripProps {
    today: IMyBranchPerformance['today'];
    week: IMyBranchPerformance['week'];
    inventory: IMyBranchPerformance['inventory'];
    dailySalesSpark: number[];
}

export function BranchKpiStrip({
    today,
    week,
    inventory,
    dailySalesSpark,
}: BranchKpiStripProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
                label="Today's revenue"
                value={formatCurrencyWhole(today.sales)}
                delta={`${today.transactions} transactions`}
                sparkColor="var(--accent)"
                sparkData={dailySalesSpark.slice(-7) || [1, 2]}
            />
            <KpiCard
                label="Avg transaction"
                value={formatCurrencyWhole(today.avgTransaction)}
                delta="Today"
                sparkColor="var(--primary)"
                sparkData={[3, 4, 5, 4, 6, 5, 7]}
            />
            <KpiCard
                label="This week"
                value={formatCurrencyWhole(week.sales)}
                delta={`${week.transactions} transactions`}
                sparkColor="var(--brand-400)"
                sparkData={dailySalesSpark || [1, 2]}
            />
            <KpiCard
                label="Low stock items"
                value={String(inventory.lowStockItems)}
                delta={`${inventory.outOfStock} out of stock`}
                deltaPositive={inventory.lowStockItems === 0}
                sparkColor="var(--warning)"
                sparkData={[2, 3, 4, 3, 4, 5, 4]}
            />
        </div>
    );
}
