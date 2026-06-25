import { DataTable, EmptyState, type DataTableColumn } from '@/components/ui';
import type { IAttendance } from '@/types';
import { clockHm } from '@/features/worker-dashboard/lib/attendance-metrics';

interface WorkerRecentAttendanceProps {
    rows: IAttendance[];
}

const STATUS_STYLES: Record<IAttendance['status'], string> = {
    Present: 'bg-accent-soft text-accent-text',
    Half_Day: 'bg-warning-soft text-warning',
    Absent: 'bg-danger-soft text-danger',
    Leave: 'bg-primary-soft text-primary-soft-text',
    Holiday: 'bg-surface-2 text-text-2',
    Weekend: 'bg-surface-2 text-text-3',
};

function formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

/** Read-only table of the worker's most recent attendance rows. */
export function WorkerRecentAttendance({ rows }: WorkerRecentAttendanceProps) {
    const recent = rows.slice(0, 8);

    const columns: DataTableColumn<IAttendance>[] = [
        {
            key: 'date',
            header: 'Date',
            render: (r) => formatDate(r.attendanceDate),
        },
        {
            key: 'in',
            header: 'In',
            className: 'tabular-nums text-text-2',
            render: (r) => clockHm(r.checkInTime),
        },
        {
            key: 'out',
            header: 'Out',
            className: 'tabular-nums text-text-2',
            render: (r) => clockHm(r.checkOutTime),
        },
        {
            key: 'hours',
            header: 'Hours',
            align: 'right',
            className: 'tabular-nums',
            render: (r) => r.totalHours ?? '—',
        },
        {
            key: 'status',
            header: 'Status',
            align: 'right',
            render: (r) => (
                <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                >
                    {r.status.replace('_', ' ')}
                    {r.isLate ? ' · late' : ''}
                </span>
            ),
        },
    ];

    return (
        <div className="bg-surface border border-border rounded-md shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-text-1">
                    Recent attendance
                </h2>
            </div>
            <DataTable
                columns={columns}
                rows={recent}
                getRowKey={(r) => r.id}
                zebra
                empty={
                    <EmptyState title="No attendance recorded yet this month." />
                }
            />
        </div>
    );
}
