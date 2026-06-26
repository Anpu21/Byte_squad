import KpiCard from '@/components/ui/KpiCard';
import type { ICashierDashboard } from '@/types';
import { formatRevenue } from '@/features/admin-dashboard/lib/format';
import {
    LuStore as Store,
    LuReceipt as Receipt,
    LuTrendingUp as TrendingUp,
    LuWallet as Wallet,
} from 'react-icons/lu';

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
                accent="primary"
                icon={<Store size={16} />}
            />
            <KpiCard
                label="Transactions"
                value={String(data?.today.transactionCount ?? 0)}
                delta="completed"
                sparkData={safeSparkline}
                accent="info"
                icon={<Receipt size={16} />}
            />
            <KpiCard
                label="Avg sale"
                value={formatRevenue(data?.today.averageSale ?? 0)}
                delta="per transaction"
                sparkColor="var(--brand-400)"
                sparkData={[3, 5, 4, 6, 5, 7]}
                accent="accent"
                icon={<TrendingUp size={16} />}
            />
            <KpiCard
                label="Weekly total"
                value={formatRevenue(data?.week.totalSales ?? 0)}
                delta={`${data?.week.transactionCount ?? 0} txns`}
                sparkData={safeSparkline}
                accent="accent"
                icon={<Wallet size={16} />}
            />
        </div>
    );
}
