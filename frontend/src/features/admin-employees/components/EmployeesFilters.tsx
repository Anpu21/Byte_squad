import { useQuery } from '@tanstack/react-query';
import { LuSearch as Search, LuX as X } from 'react-icons/lu';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';

type EmployeeStatus = 'Active' | 'Resigned' | 'Terminated' | 'OnLeave' | '';

interface IEmployeesFiltersProps {
    searchDraft: string;
    onSearchDraftChange: (value: string) => void;
    branchId: string;
    onBranchIdChange: (id: string) => void;
    status: EmployeeStatus;
    onStatusChange: (status: EmployeeStatus) => void;
    canPickBranch: boolean;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 transition-colors';

const STATUS_OPTIONS: Array<{ value: EmployeeStatus; label: string }> = [
    { value: '', label: 'All statuses' },
    { value: 'Active', label: 'Active' },
    { value: 'OnLeave', label: 'On leave' },
    { value: 'Resigned', label: 'Resigned' },
    { value: 'Terminated', label: 'Terminated' },
];

/**
 * Filter chip row that drives `useEmployees`. The branch select is
 * hidden for managers (they are pinned to their own branch by the
 * BE; offering a "All branches" picker would be misleading).
 */
export function EmployeesFilters({
    searchDraft,
    onSearchDraftChange,
    branchId,
    onBranchIdChange,
    status,
    onStatusChange,
    canPickBranch,
}: IEmployeesFiltersProps) {
    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
        enabled: canPickBranch,
    });
    const branches = branchesQuery.data ?? [];

    return (
        <div className="px-5 py-3.5 border-b border-border bg-surface-2/40 flex items-center flex-wrap gap-3">
            <div className="relative flex-1 max-w-[280px]">
                <Search
                    size={14}
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
                />
                <input
                    type="text"
                    value={searchDraft}
                    onChange={(e) => onSearchDraftChange(e.target.value)}
                    placeholder="Search name, code, NIC…"
                    aria-label="Search employees"
                    className={`w-full pl-9 pr-9 ${INPUT_CLASS}`}
                />
                {searchDraft && (
                    <button
                        type="button"
                        onClick={() => onSearchDraftChange('')}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-text-3 hover:text-text-1"
                    >
                        <X size={12} />
                    </button>
                )}
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
                        className={`${INPUT_CLASS} w-40`}
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
                    Status
                </span>
                <select
                    value={status}
                    onChange={(e) =>
                        onStatusChange(e.target.value as EmployeeStatus)
                    }
                    aria-label="Filter by status"
                    className={`${INPUT_CLASS} w-36`}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
