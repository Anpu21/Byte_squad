import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { formatIsoDate, shiftIsoDate } from '../lib/attendance-grid-helpers';

interface IAttendanceFiltersProps {
    selectedDate: string;
    onDateChange: (value: string) => void;
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

/**
 * Toolbar for the day-at-a-time attendance table. A Prev / Today / Next day
 * navigator + date picker moves through past records; the branch select is
 * hidden for managers (pinned to their branch BE-side); the role select only
 * appears when the branch roster spans more than one role.
 */
export function AttendanceFilters({
    selectedDate,
    onDateChange,
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
    const today = formatIsoDate(new Date());
    const isToday = selectedDate === today;

    return (
        <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3 mr-1">
                    Day
                </span>
                <button
                    type="button"
                    aria-label="Previous day"
                    onClick={() => onDateChange(shiftIsoDate(selectedDate, -1))}
                    className={ICON_BUTTON_CLASS}
                >
                    <ChevronLeft size={16} />
                </button>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    aria-label="Pick attendance day"
                    className={`${INPUT_CLASS} w-44`}
                />
                <button
                    type="button"
                    aria-label="Next day"
                    onClick={() => onDateChange(shiftIsoDate(selectedDate, 1))}
                    className={ICON_BUTTON_CLASS}
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => onDateChange(today)}
                    disabled={isToday}
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
