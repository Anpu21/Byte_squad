import { Calendar, CalendarDays, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import type { ICashierTransactionsSummary } from '@/types';
import { formatRevenue } from '../lib/format';

interface TransactionsKpisProps {
    data: ICashierTransactionsSummary | undefined;
}

export function TransactionsKpis({ data }: TransactionsKpisProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
                label="Today"
                value={formatRevenue(data?.today.totalSales ?? 0)}
                delta={`${data?.today.transactionCount ?? 0} transactions`}
                sparkData={[2, 3, 4, 5, 7, 6, 8]}
                sparkColor="var(--accent)"
                icon={<Calendar size={14} />}
            />
            <KpiCard
                label="This month"
                value={formatRevenue(data?.month.totalSales ?? 0)}
                delta={`${data?.month.transactionCount ?? 0} transactions`}
                sparkData={[3, 4, 5, 7, 6, 8, 10]}
                icon={<CalendarDays size={14} />}
            />
            <KpiCard
                label="This year"
                value={formatRevenue(data?.year.totalSales ?? 0)}
                delta={`${data?.year.transactionCount ?? 0} transactions`}
                sparkData={[4, 5, 6, 7, 8, 9, 11]}
                sparkColor="var(--brand-400)"
                icon={<TrendingUp size={14} />}
            />
        </div>
    );
}
