import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import {
    formatIsoMonth,
    shiftIsoMonth,
} from '../lib/attendance-grid-helpers';

interface IAttendanceFiltersProps {
    monthValue: string;
    onMonthChange: (value: string) => void;
    branchId: string;
    onBranchIdChange: (id: string) => void;
    canPickBranch: boolean;
    roleFilter: string;
    roleOptions: string[];
    onRoleChange: (role: string) => void;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

const ICON_BUTTON_CLASS =
    'h-9 w-9 inline-flex items-center justify-center bg-surface border border-border rounded-md text-text-2 hover:text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20';

function currentMonth(): string {
    const now = new Date();
    return formatIsoMonth(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Filter chip row that drives the attendance view. Branch select
 * is hidden for managers (they're pinned to their branch BE-side).
 * Month picker is flanked by Prev / Today / Next chevrons for fast
 * nav. Employee select toggles the view: empty → roster summary,
 * selected → calendar for that employee.
 */
export function AttendanceFilters({
    monthValue,
    onMonthChange,
    branchId,
    onBranchIdChange,
    canPickBranch,
    roleFilter,
    roleOptions,
    onRoleChange,
}: IAttendanceFiltersProps) {
    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
        enabled: canPickBranch,
    });
    const branches = branchesQuery.data ?? [];
    const today = currentMonth();
    const isThisMonth = monthValue === today;

    return (
        <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3 mr-1">
                    Month
                </span>
                <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => onMonthChange(shiftIsoMonth(monthValue, -1))}
                    className={ICON_BUTTON_CLASS}
                >
                    <ChevronLeft size={16} />
                </button>
                <input
                    type="month"
                    value={monthValue}
                    onChange={(e) => onMonthChange(e.target.value)}
                    aria-label="Pick attendance month"
                    className={`${INPUT_CLASS} w-40`}
                />
                <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => onMonthChange(shiftIsoMonth(monthValue, 1))}
                    className={ICON_BUTTON_CLASS}
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onMonthChange(today)}
                    disabled={isThisMonth}
                    className="h-9 px-3 bg-surface border border-border rounded-md text-[12px] font-medium text-text-1 hover:bg-surface-2 transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Today
                </button>
            </div>

            {canPickBranch && (
                <label className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Branch
                    </span>
                    <select
                        value={branchId}
                        onChange={(e) => onBranchIdChange(e.target.value)}
                        aria-label="Filter by branch"
                        className={`${INPUT_CLASS} w-44`}
                    >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            {roleOptions.length > 1 && (
                <label className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Role
                    </span>
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleChange(e.target.value)}
                        aria-label="Filter by role"
                        className={`${INPUT_CLASS} w-44`}
                    >
                        <option value="">All roles</option>
                        {roleOptions.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </label>
            )}
        </div>
    );
}
