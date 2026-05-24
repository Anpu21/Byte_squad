import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { isPartialDecimal } from '@/lib/numeric-input';

interface ILoyaltyCustomersFiltersProps {
    searchDraft: string;
    onSearchDraftChange: (value: string) => void;
    branchId: string;
    onBranchIdChange: (id: string) => void;
    activeSince: string;
    onActiveSinceChange: (date: string) => void;
    minPoints: string;
    maxPoints: string;
    onPointsRangeChange: (min: string, max: string) => void;
}

const INPUT_CLASS =
    'h-9 px-3 bg-surface border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/20 transition-colors';

/**
 * Filter chip row that drives `useLoyaltyCustomers`. Each chip is
 * standalone — clearing one (e.g. branch) leaves the others in place.
 * Empty filters are omitted from the wire payload by the hook, so the
 * BE only narrows when the admin has typed something.
 */
export function LoyaltyCustomersFilters({
    searchDraft,
    onSearchDraftChange,
    branchId,
    onBranchIdChange,
    activeSince,
    onActiveSinceChange,
    minPoints,
    maxPoints,
    onPointsRangeChange,
}: ILoyaltyCustomersFiltersProps) {
    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
    });
    const branches = branchesQuery.data ?? [];

    function handleMinChange(value: string) {
        if (isPartialDecimal(value)) onPointsRangeChange(value, maxPoints);
    }
    function handleMaxChange(value: string) {
        if (isPartialDecimal(value)) onPointsRangeChange(minPoints, value);
    }

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
                    placeholder="Search name, email, phone…"
                    aria-label="Search loyalty customers"
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

            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Active since
                </span>
                <input
                    type="date"
                    value={activeSince}
                    onChange={(e) => onActiveSinceChange(e.target.value)}
                    aria-label="Filter by activity date"
                    className={`${INPUT_CLASS} w-40`}
                />
                {activeSince && (
                    <button
                        type="button"
                        onClick={() => onActiveSinceChange('')}
                        aria-label="Clear active-since"
                        className="p-1 rounded text-text-3 hover:text-text-1"
                    >
                        <X size={12} />
                    </button>
                )}
            </label>

            <label className="flex items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wide text-text-3">
                    Points
                </span>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="min"
                    value={minPoints}
                    onChange={(e) => handleMinChange(e.target.value)}
                    aria-label="Minimum points"
                    className={`${INPUT_CLASS} w-20 text-right`}
                />
                <span className="text-text-3 text-[12px]">–</span>
                <input
                    type="text"
                    inputMode="numeric"
                    placeholder="max"
                    value={maxPoints}
                    onChange={(e) => handleMaxChange(e.target.value)}
                    aria-label="Maximum points"
                    className={`${INPUT_CLASS} w-20 text-right`}
                />
                {(minPoints || maxPoints) && (
                    <button
                        type="button"
                        onClick={() => onPointsRangeChange('', '')}
                        aria-label="Clear points range"
                        className="p-1 rounded text-text-3 hover:text-text-1"
                    >
                        <X size={12} />
                    </button>
                )}
            </label>
        </div>
    );
}
