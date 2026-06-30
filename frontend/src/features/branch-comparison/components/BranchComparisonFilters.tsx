import { LuCircleAlert as AlertCircle, LuCheckCheck as CheckCheck, LuLoaderCircle as Loader2, LuRefreshCw as RefreshCw, LuX as X } from 'react-icons/lu';
import Card from "@/components/ui/Card";
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { IBranchAnalyticsBranchOption } from "@/types";
import {
  PRESET_LABELS,
  PRESET_ORDER,
  type PresetKey,
} from "../lib/preset-ranges";

export interface BranchComparisonFilterValues {
  selectedIds: string[];
  startDate: string;
  endDate: string;
  activePreset: PresetKey;
}

export interface BranchComparisonFilterActions {
  toggleBranch: (id: string) => void;
  selectAllBranches: () => void;
  clearBranches: () => void;
  setPreset: (key: PresetKey) => void;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
}

interface BranchComparisonFiltersProps {
  branches: IBranchAnalyticsBranchOption[];
  filters: BranchComparisonFilterValues;
  actions: BranchComparisonFilterActions;
  lockedBranchIds: string[];
  isFetching: boolean;
  isDebouncing: boolean;
  dateError: string | null;
  branchColors?: Record<string, string>;
}

const INPUT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} w-full h-9 px-3`;

export function BranchComparisonFilters({
  branches,
  filters,
  actions,
  lockedBranchIds,
  isFetching,
  isDebouncing,
  dateError,
  branchColors,
}: BranchComparisonFiltersProps) {
  const allSelected =
    branches.length > 0 &&
    branches.every((b) => filters.selectedIds.includes(b.id));
  const removableSelectedCount = filters.selectedIds.filter(
    (id) => !lockedBranchIds.includes(id),
  ).length;
  const showCustomDates = filters.activePreset === "custom";

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
    <Card className="p-5 mb-6">
      <div className="flex flex-col gap-4">
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

        <div className="grid grid-cols-1 gap-3 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="block text-[11px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-2">
              Date range
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_ORDER.map((key) => {
                const active = filters.activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => actions.setPreset(key)}
                    aria-current={active ? "true" : undefined}
                    className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                      active
                        ? "bg-primary text-text-inv border-primary"
                        : "bg-surface text-text-2 border-border-strong hover:text-text-1 hover:bg-surface-2"
                    }`}
                  >
                    {PRESET_LABELS[key]}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className={
              showCustomDates
                ? "grid grid-cols-1 gap-3 sm:grid-cols-2"
                : "hidden"
            }
          >
            <div>
              <label
                htmlFor="bc-start"
                className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1.5"
              >
                Start date
              </label>
              <input
                id="bc-start"
                type="date"
                value={filters.startDate}
                onChange={(e) => actions.setStartDate(e.target.value)}
                className={`${INPUT_CLASS}${(filters.startDate) ? '' : ' date-empty'}`}
              />
            </div>
            <div>
              <label
                htmlFor="bc-end"
                className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-1.5"
              >
                End date
              </label>
              <input
                id="bc-end"
                type="date"
                value={filters.endDate}
                onChange={(e) => actions.setEndDate(e.target.value)}
                className={`${INPUT_CLASS}${(filters.endDate) ? '' : ' date-empty'}`}
              />
            </div>
          </div>
        </div>

        {dateError && (
          <p className="text-[12px] font-medium text-danger">{dateError}</p>
        )}
      </div>
    </Card>
  );
}
