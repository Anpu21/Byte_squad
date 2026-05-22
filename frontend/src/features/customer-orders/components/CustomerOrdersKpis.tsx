import { CalendarDays, CheckCircle2, Clock } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import type { OrdersKpis } from '../lib/metrics';

interface CustomerOrdersKpisProps {
    kpis: OrdersKpis;
}

export function CustomerOrdersKpis({ kpis }: CustomerOrdersKpisProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
                label="Pending"
                value={kpis.pending}
                delta={
                    kpis.pending > 0
                        ? `${kpis.pending} need attention`
                        : 'All clear'
                }
                deltaPositive={kpis.pending === 0}
                sparkData={[2, 3, 2, 4, 3, 5, 4]}
                sparkColor="var(--warning)"
                icon={<Clock size={14} />}
            />
            <KpiCard
                label="Completed today"
                value={kpis.completedToday}
                delta="Pickups fulfilled"
                sparkData={[1, 2, 3, 4, 5, 6, 7]}
                sparkColor="var(--accent)"
                icon={<CheckCircle2 size={14} />}
            />
            <KpiCard
                label="This month"
                value={kpis.monthTotal}
                delta="Total orders"
                sparkData={[3, 5, 4, 6, 7, 8, 9]}
                icon={<CalendarDays size={14} />}
            />
        </div>
    );
}
