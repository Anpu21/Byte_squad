import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee, LeaveStatus } from '@/types';
import { LEAVE_STATUSES } from '../lib/leave-formatting';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

interface ILeavesFiltersProps {
    branchId: string;
    onBranchIdChange: (id: string) => void;
    employeeId: string;
    onEmployeeIdChange: (id: string) => void;
    status: '' | LeaveStatus;
    onStatusChange: (s: '' | LeaveStatus) => void;
    canPickBranch: boolean;
    employees: IEmployee[];
}

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

/**
 * Filter row for the leaves list. Branch select is hidden for
 * managers (server-pinned). Employee select narrows the table when
 * approving for a single person.
 */
export function LeavesFilters({
    branchId,
    onBranchIdChange,
    employeeId,
    onEmployeeIdChange,
    status,
    onStatusChange,
    canPickBranch,
    employees,
}: ILeavesFiltersProps) {
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
                    Status
                </span>
                <select
                    className={INPUT_CLASS}
                    value={status}
                    onChange={(e) =>
                        onStatusChange(e.target.value as '' | LeaveStatus)
                    }
                >
                    <option value="">All</option>
                    {LEAVE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </label>
            {canPickBranch ? (
                <label className="flex items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-wide text-text-3">
                        Branch
                    </span>
                    <select
                        className={INPUT_CLASS}
                        value={branchId}
                        onChange={(e) => onBranchIdChange(e.target.value)}
                    >
                        <option value="">All branches</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </label>
            ) : null}
            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Employee
                </span>
                <select
                    className={INPUT_CLASS}
                    value={employeeId}
                    onChange={(e) => onEmployeeIdChange(e.target.value)}
                >
                    <option value="">All employees</option>
                    {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                            {e.fullName}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
