import Card from "@/components/ui/Card";
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';
import type { IBranchAnalyticsBranchOption } from "@/types";
import {
  PRESET_LABELS,
  PRESET_ORDER,
  type PresetKey,
} from "../lib/preset-ranges";
import { BranchPickerRow } from "./BranchPickerRow";

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
  const showCustomDates = filters.activePreset === "custom";

  return (
    <Card className="p-5 mb-6">
      <div className="flex flex-col gap-4">
        <BranchPickerRow
          branches={branches}
          filters={filters}
          actions={actions}
          lockedBranchIds={lockedBranchIds}
          isFetching={isFetching}
          isDebouncing={isDebouncing}
          dateError={dateError}
          branchColors={branchColors}
        />

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
