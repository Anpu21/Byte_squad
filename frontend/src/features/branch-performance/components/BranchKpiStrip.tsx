import {
    LuBanknote as Banknote,
    LuReceipt as Receipt,
    LuTrendingUp as TrendingUp,
    LuTriangleAlert as TriangleAlert,
} from 'react-icons/lu';
import KpiCard from '@/components/ui/KpiCard';
import type { IMyBranchPerformance } from '@/types';
import { formatCurrencyWhole } from '../lib/format';

interface BranchKpiStripProps {
    today: IMyBranchPerformance['today'];
    week: IMyBranchPerformance['week'];
    inventory: IMyBranchPerformance['inventory'];
    dailySalesSpark: number[];
}

// Staggered entrance + subtle hover lift. `backwards` fill keeps each card
// hidden through its delay; the global prefers-reduced-motion block neutralises
// the animation + transform for users who opt out.
const CARD_MOTION =
    'animate-in fade-in slide-in-from-bottom-3 [animation-fill-mode:backwards] transition-transform duration-200 hover:-translate-y-0.5';

export function BranchKpiStrip({
    today,
    week,
    inventory,
    dailySalesSpark,
}: BranchKpiStripProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard
                className={`${CARD_MOTION} [animation-delay:0ms]`}
                label="Today's revenue"
                value={formatCurrencyWhole(today.sales)}
                delta={`${today.transactions} transactions`}
                accent="accent"
                icon={<Banknote size={16} />}
                sparkColor="var(--accent)"
                sparkData={dailySalesSpark.slice(-7) || [1, 2]}
            />
            <KpiCard
                className={`${CARD_MOTION} [animation-delay:70ms]`}
                label="Avg transaction"
                value={formatCurrencyWhole(today.avgTransaction)}
                delta="Today"
                accent="info"
                icon={<Receipt size={16} />}
                sparkColor="var(--primary)"
                sparkData={[3, 4, 5, 4, 6, 5, 7]}
            />
            <KpiCard
                className={`${CARD_MOTION} [animation-delay:140ms]`}
                label="This week"
                value={formatCurrencyWhole(week.sales)}
                delta={`${week.transactions} transactions`}
                accent="accent"
                icon={<TrendingUp size={16} />}
                sparkColor="var(--brand-400)"
                sparkData={dailySalesSpark || [1, 2]}
            />
            <KpiCard
                className={`${CARD_MOTION} [animation-delay:210ms]`}
                label="Low stock items"
                value={String(inventory.lowStockItems)}
                delta={`${inventory.outOfStock} out of stock`}
                deltaPositive={inventory.lowStockItems === 0}
                accent="warning"
                icon={<TriangleAlert size={16} />}
                sparkColor="var(--warning)"
                sparkData={[2, 3, 4, 3, 4, 5, 4]}
            />
        </div>
    );
}
