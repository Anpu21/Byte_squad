import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee } from '@/types';

interface IAttendanceFiltersProps {
    monthValue: string;
    onMonthChange: (value: string) => void;
    branchId: string;
    onBranchIdChange: (id: string) => void;
    employeeId: string;
    onEmployeeIdChange: (id: string) => void;
    canPickBranch: boolean;
    employees: IEmployee[];
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Filter chip row that drives the attendance grid. Branch select
 * is hidden for managers (they're pinned to their branch BE-side).
 * Employee select lets a manager focus on one row at a time when
 * the branch roster is too wide for the editorial grid.
 */
export function AttendanceFilters({
    monthValue,
    onMonthChange,
    branchId,
    onBranchIdChange,
    employeeId,
    onEmployeeIdChange,
    canPickBranch,
    employees,
}: IAttendanceFiltersProps) {
    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
        enabled: canPickBranch,
    });
    const branches = branchesQuery.data ?? [];

    return (
        <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center flex-wrap gap-3">
            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Month
                </span>
                <input
                    type="month"
                    value={monthValue}
                    onChange={(e) => onMonthChange(e.target.value)}
                    aria-label="Pick attendance month"
                    className={`${INPUT_CLASS} w-40`}
                />
            </label>

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

            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Employee
                </span>
                <select
                    value={employeeId}
                    onChange={(e) => onEmployeeIdChange(e.target.value)}
                    aria-label="Filter by employee"
                    className={`${INPUT_CLASS} w-52`}
                >
                    <option value="">All employees</option>
                    {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                            {emp.fullName} ({emp.employeeCode})
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
