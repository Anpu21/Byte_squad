import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { AttendanceStatus, IBulkAttendanceRow } from '@/types';
import { useBulkUpsertAttendance } from '../hooks/useBulkUpsertAttendance';

interface AttendanceTodayBannerProps {
    /** Admin's selected branch; managers are pinned to their own server-side. */
    branchId?: string;
    /** When provided, each pending name opens the full edit modal for today. */
    onMark?: (employeeId: string) => void;
}

/**
 * Daily attendance action bar above the grid. Shows who is *not recorded today*
 * and turns marking into one click: "Mark all present" handles the everyday
 * case in a single bulk call, and each pending person has Present / Absent
 * quick buttons. The name still opens the full modal (`onMark`) for the rarer
 * statuses (Half-day / Leave / Holiday). On success the bulk hook invalidates
 * the whole `hr` query family, so this banner and the grid both refresh.
 */
export function AttendanceTodayBanner({
    branchId,
    onMark,
}: AttendanceTodayBannerProps) {
    const { data } = useQuery({
        queryKey: queryKeys.hr.branchTodayStatus(branchId),
        queryFn: () => hrService.getBranchTodayStatus(branchId),
        staleTime: 60_000,
    });
    const bulk = useBulkUpsertAttendance();

    function markRows(rows: IBulkAttendanceRow[], successLabel: string) {
        if (rows.length === 0) return;
        bulk.mutate(
            { rows },
            {
                onSuccess: () => toast.success(successLabel),
                onError: () =>
                    toast.error('Could not save attendance - please retry'),
            },
        );
    }

    if (!data || data.total === 0) return null;

    function markAll(status: AttendanceStatus, label: string) {
        if (!data) return;
        markRows(
            data.pending.map((p) => ({
                employeeId: p.employeeId,
                attendanceDate: data.date,
                status,
            })),
            label,
        );
    }

    function markOne(employeeId: string, status: AttendanceStatus) {
        if (!data) return;
        markRows(
            [{ employeeId, attendanceDate: data.date, status }],
            'Attendance saved',
        );
    }

    if (data.pendingCount === 0) {
        return (
            <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface-2 text-sm text-success">
                <CheckCircle2 size={16} aria-hidden />
                All {data.total} staff are recorded for today.
            </div>
        );
    }

    return (
        <div className="mb-4 px-4 py-3 rounded-lg border border-warning/40 bg-warning-soft">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                    <AlertCircle size={16} aria-hidden />
                    {data.pendingCount} of {data.total} staff not recorded today
                </div>
                <button
                    type="button"
                    onClick={() => markAll('Present', 'Marked all present')}
                    disabled={bulk.isPending}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-text-inv text-[12px] font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircle2 size={14} aria-hidden />
                    Mark all present
                </button>
            </div>

            <div className="mt-2.5 flex flex-col gap-1.5">
                {data.pending.map((p) => (
                    <div
                        key={p.employeeId}
                        className="flex items-center gap-2 flex-wrap"
                    >
                        {onMark ? (
                            <button
                                type="button"
                                onClick={() => onMark(p.employeeId)}
                                title={`Edit ${p.fullName}'s attendance for today`}
                                className="text-left text-[12px] text-text-1 rounded hover:text-primary hover:underline focus:outline-none focus:ring-[2px] focus:ring-primary/40"
                            >
                                {p.fullName}
                                <span className="text-text-3"> · {p.role}</span>
                            </button>
                        ) : (
                            <span className="text-[12px] text-text-1">
                                {p.fullName}
                                <span className="text-text-3"> · {p.role}</span>
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => markOne(p.employeeId, 'Present')}
                                disabled={bulk.isPending}
                                className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-medium text-text-1 hover:border-primary hover:bg-primary-soft/30 transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Present
                            </button>
                            <button
                                type="button"
                                onClick={() => markOne(p.employeeId, 'Absent')}
                                disabled={bulk.isPending}
                                className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-medium text-text-1 hover:border-danger hover:bg-danger-soft/40 transition-colors focus:outline-none focus:ring-[2px] focus:ring-danger/40 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Absent
                            </button>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
