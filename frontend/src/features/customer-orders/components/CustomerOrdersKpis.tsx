import { LuCalendarDays as CalendarDays, LuCircleCheckBig as CheckCircle2, LuClock as Clock } from 'react-icons/lu';
import KpiCard from '@/components/ui/KpiCard';
import type { OrdersKpis } from '../lib/metrics';

interface CustomerOrdersKpisProps {
    kpis: OrdersKpis;
}

export function CustomerOrdersKpis({ kpis }: CustomerOrdersKpisProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <KpiCard
                label="Awaiting pickup"
                value={kpis.pending}
                delta={
                    kpis.pending > 0
                        ? `${kpis.pending} awaiting collection`
                        : 'All clear'
                }
                deltaPositive={kpis.pending === 0}
                sparkData={[2, 3, 2, 4, 3, 5, 4]}
                sparkColor="var(--warning)"
                icon={<Clock size={14} />}
            />
            <KpiCard
                label="Collected today"
                value={kpis.completedToday}
                delta="Picked up today"
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
