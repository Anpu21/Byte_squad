import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';

interface AttendanceTodayBannerProps {
    /** Admin's selected branch; managers are pinned to their own server-side. */
    branchId?: string;
}

/**
 * Daily "who hasn't been recorded today" prompt above the attendance grid.
 * Turns attendance from a pull (open the grid and scan) into a push: a manager
 * sees at a glance who still needs marking or chasing for the current day.
 */
export function AttendanceTodayBanner({ branchId }: AttendanceTodayBannerProps) {
    const { data } = useQuery({
        queryKey: queryKeys.hr.branchTodayStatus(branchId),
        queryFn: () => hrService.getBranchTodayStatus(branchId),
        staleTime: 60_000,
    });

    if (!data || data.total === 0) return null;

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
            <div className="flex items-center gap-2 text-sm font-semibold text-warning">
                <AlertCircle size={16} aria-hidden />
                {data.pendingCount} of {data.total} staff not recorded today
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
                {data.pending.map((p) => (
                    <span
                        key={p.employeeId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[12px] text-text-1"
                    >
                        {p.fullName}
                        <span className="text-text-3">· {p.role}</span>
                    </span>
                ))}
            </div>
        </div>
    );
}
