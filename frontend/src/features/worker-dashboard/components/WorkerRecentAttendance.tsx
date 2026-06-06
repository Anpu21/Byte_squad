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

    return (
        <div className="bg-surface border border-border rounded-md shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
                <h2 className="text-sm font-semibold text-text-1">
                    Recent attendance
                </h2>
            </div>
            {recent.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-text-3">
                    No attendance recorded yet this month.
                </div>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-text-3">
                            <th className="text-left font-semibold px-5 py-2">
                                Date
                            </th>
                            <th className="text-left font-semibold px-3 py-2">In</th>
                            <th className="text-left font-semibold px-3 py-2">
                                Out
                            </th>
                            <th className="text-right font-semibold px-3 py-2">
                                Hours
                            </th>
                            <th className="text-right font-semibold px-5 py-2">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.map((r) => (
                            <tr key={r.id} className="border-t border-border">
                                <td className="px-5 py-2.5 text-text-1">
                                    {formatDate(r.attendanceDate)}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums text-text-2">
                                    {clockHm(r.checkInTime)}
                                </td>
                                <td className="px-3 py-2.5 tabular-nums text-text-2">
                                    {clockHm(r.checkOutTime)}
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums text-text-1">
                                    {r.totalHours ?? '—'}
                                </td>
                                <td className="px-5 py-2.5 text-right">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status]}`}
                                    >
                                        {r.status.replace('_', ' ')}
                                        {r.isLate ? ' · late' : ''}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
