import { LuCircleAlert as AlertCircle, LuCheckCheck as CheckCheck, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw, LuX as X } from 'react-icons/lu';
import type { IBranchAnalyticsBranchOption } from '@/types';
import type {
  BranchComparisonFilterActions,
  BranchComparisonFilterValues,
} from './BranchComparisonFilters';

interface BranchPickerRowProps {
  branches: IBranchAnalyticsBranchOption[];
  filters: BranchComparisonFilterValues;
  actions: BranchComparisonFilterActions;
  lockedBranchIds: string[];
  isFetching: boolean;
  isDebouncing: boolean;
  dateError: string | null;
  branchColors?: Record<string, string>;
}

/** Branch multi-select pills + the live auto-update status indicator. */
export function BranchPickerRow({
  branches,
  filters,
  actions,
  lockedBranchIds,
  isFetching,
  isDebouncing,
  dateError,
  branchColors,
}: BranchPickerRowProps) {
  const allSelected =
    branches.length > 0 &&
    branches.every((b) => filters.selectedIds.includes(b.id));
  const removableSelectedCount = filters.selectedIds.filter(
    (id) => !lockedBranchIds.includes(id),
  ).length;

  const statusText =
    filters.selectedIds.length < 1
      ? "Select at least one branch"
      : dateError
        ? "Date range needs attention"
        : isFetching
          ? "Refreshing comparison"
          : isDebouncing
            ? "Preparing refresh"
            : "Auto-updated";

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="block text-[11px] uppercase tracking-[0.1em] text-text-3 font-semibold">
            Branches
            {filters.selectedIds.length > 0 && (
              <span className="ml-2 text-text-2 normal-case tracking-normal font-medium">
                · {filters.selectedIds.length} selected
              </span>
            )}
          </span>
          {branches.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={actions.selectAllBranches}
                disabled={allSelected}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30 rounded px-1 py-0.5"
              >
                <CheckCheck size={11} /> Select all
              </button>
              <span className="text-text-3 text-[11px]">·</span>
              <button
                type="button"
                onClick={actions.clearBranches}
                disabled={
                  filters.selectedIds.length === 0 ||
                  removableSelectedCount === 0
                }
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-2 hover:text-text-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-[3px] focus:ring-primary/30 rounded px-1 py-0.5"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {branches.length === 0 ? (
            <p className="text-sm text-text-3">No branches available</p>
          ) : (
            branches.map((b) => {
              const active = filters.selectedIds.includes(b.id);
              const locked = lockedBranchIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => actions.toggleBranch(b.id)}
                  aria-pressed={active}
                  disabled={locked}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                    active
                      ? "bg-primary text-text-inv border-primary"
                      : "bg-surface text-text-1 border-border-strong hover:bg-surface-2"
                  } ${locked ? "cursor-not-allowed opacity-90" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: active
                        ? (branchColors?.[b.id] ?? "var(--primary)")
                        : "var(--border-strong)",
                    }}
                  />
                  {b.name}
                  {locked ? (
                    <span className="text-[10px] font-bold opacity-80">
                      Own
                    </span>
                  ) : (
                    active && <X size={12} className="opacity-80" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[12px] text-text-2">
        {dateError ? (
          <AlertCircle size={14} className="text-danger" />
        ) : isFetching || isDebouncing ? (
          <Loader2 size={14} className="animate-spin text-primary" />
        ) : (
          <RefreshCw size={14} className="text-accent-text" />
        )}
        <span className="font-semibold">{statusText}</span>
      </div>
    </div>
  );
}
