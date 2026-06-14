import { CalendarCheck, Clock, Hourglass, TimerOff } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';
import type { WorkerAttendanceMetrics } from '@/features/worker-dashboard/lib/attendance-metrics';

interface WorkerKpisProps {
    metrics: WorkerAttendanceMetrics;
}

/** Four-up KPI row: today's hours, week total, month present + late counts. */
export function WorkerKpis({ metrics }: WorkerKpisProps) {
    const onShift =
        Boolean(metrics.today?.checkInTime) && !metrics.today?.checkOutTime;
    const hoursToday = onShift
        ? 'In progress'
        : metrics.hoursToday != null
          ? `${metrics.hoursToday} h`
          : '—';

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <KpiCard
                label="Hours today"
                value={hoursToday}
                icon={<Hourglass size={15} />}
            />
            <KpiCard
                label="This week"
                value={`${metrics.hoursThisWeek} h`}
                icon={<Clock size={15} />}
            />
            <KpiCard
                label="Present (mo)"
                value={metrics.presentDaysThisMonth}
                icon={<CalendarCheck size={15} />}
            />
            <KpiCard
                label="Late (mo)"
                value={metrics.lateDaysThisMonth}
                icon={<TimerOff size={15} />}
            />
        </div>
    );
}
