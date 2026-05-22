import KpiCard from '@/components/ui/KpiCard';
import { formatRevenue } from '@/features/admin-dashboard/lib/format';
import type { ICashierDashboard } from '@/types';

interface CashierKpisProps {
    data: ICashierDashboard | undefined;
    sparkline: number[];
}

export function CashierKpis({ data, sparkline }: CashierKpisProps) {
    const safeSparkline = sparkline.length >= 2 ? sparkline : [1, 2, 3, 4];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <KpiCard
                label="Sales today"
                value={formatRevenue(data?.today.totalSales ?? 0)}
                delta={`${data?.today.transactionCount ?? 0} transactions`}
                sparkData={safeSparkline}
                sparkColor="var(--accent)"
            />
            <KpiCard
                label="Transactions"
                value={String(data?.today.transactionCount ?? 0)}
                delta="completed"
                sparkData={safeSparkline}
            />
            <KpiCard
                label="Avg sale"
                value={formatRevenue(data?.today.averageSale ?? 0)}
                delta="per transaction"
                sparkColor="var(--brand-400)"
                sparkData={[3, 5, 4, 6, 5, 7]}
            />
            <KpiCard
                label="Weekly total"
                value={formatRevenue(data?.week.totalSales ?? 0)}
                delta={`${data?.week.transactionCount ?? 0} txns`}
                sparkData={safeSparkline}
            />
        </div>
    );
}
