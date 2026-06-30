import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import type { PayrollStatus } from '@/types';
import { PAYROLL_STATUSES } from '../lib/payroll-formatting';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

interface IPayrollFiltersProps {
    monthValue: string;
    onMonthChange: (v: string) => void;
    branchId: string;
    onBranchIdChange: (id: string) => void;
    status: '' | PayrollStatus;
    onStatusChange: (s: '' | PayrollStatus) => void;
    canPickBranch: boolean;
}

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} h-9 px-3`;

/**
 * Filter chip row for the payroll table. Month picker drives both
 * the list query and the "Generate" / "Export CSV" actions in the
 * parent page so the period is always in lockstep.
 */
export function PayrollFilters({
    monthValue,
    onMonthChange,
    branchId,
    onBranchIdChange,
    status,
    onStatusChange,
    canPickBranch,
}: IPayrollFiltersProps) {
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
                    Period
                </span>
                <input
                    className={INPUT_CLASS}
                    type="month"
                    value={monthValue}
                    onChange={(e) => onMonthChange(e.target.value)}
                />
            </label>
            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Status
                </span>
                <select
                    className={INPUT_CLASS}
                    value={status}
                    onChange={(e) =>
                        onStatusChange(e.target.value as '' | PayrollStatus)
                    }
                >
                    <option value="">All</option>
                    {PAYROLL_STATUSES.map((s) => (
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
        </div>
    );
}
