import { CheckCheck, GitCompareArrows, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { IBranch } from '@/types';
import {
    PRESET_LABELS,
    PRESET_ORDER,
    type PresetKey,
} from '../lib/preset-ranges';

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
    run: () => void;
}

interface BranchComparisonFiltersProps {
    branches: IBranch[];
    filters: BranchComparisonFilterValues;
    actions: BranchComparisonFilterActions;
    isFetching: boolean;
    runIsStale: boolean;
}

const INPUT_CLASS =
    'w-full h-9 px-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

export function BranchComparisonFilters({
    branches,
    filters,
    actions,
    isFetching,
    runIsStale,
}: BranchComparisonFiltersProps) {
    const allSelected =
        branches.length > 0 &&
        branches.every((b) => filters.selectedIds.includes(b.id));
    const showCustomDates = filters.activePreset === 'custom';

    return (
        <Card className="p-5 mb-6">
            <div className="flex flex-col gap-4">
                <div>
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
                                        filters.selectedIds.length === 0
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
                            <p className="text-sm text-text-3">
                                No branches available
                            </p>
                        ) : (
                            branches.map((b) => {
                                const active = filters.selectedIds.includes(
                                    b.id,
                                );
                                return (
                                    <button
                                        key={b.id}
                                        type="button"
                                        onClick={() => actions.toggleBranch(b.id)}
                                        aria-pressed={active}
                                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                                            active
                                                ? 'bg-primary text-text-inv border-primary'
                                                : 'bg-surface text-text-1 border-border-strong hover:bg-surface-2'
                                        }`}
                                    >
                                        {b.name}
                                        {active && (
                                            <X size={12} className="opacity-80" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

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
                                    aria-current={active ? 'true' : undefined}
                                    className={`inline-flex items-center h-8 px-3 rounded-full text-xs font-semibold border transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
                                        active
                                            ? 'bg-primary text-text-inv border-primary'
                                            : 'bg-surface text-text-2 border-border-strong hover:text-text-1 hover:bg-surface-2'
                                    }`}
                                >
                                    {PRESET_LABELS[key]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {showCustomDates && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                onChange={(e) =>
                                    actions.setStartDate(e.target.value)
                                }
                                className={INPUT_CLASS}
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
                                onChange={(e) =>
                                    actions.setEndDate(e.target.value)
                                }
                                className={INPUT_CLASS}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between gap-3 pt-1 border-t border-border">
                    <p className="text-[11px] text-text-3">
                        {filters.selectedIds.length < 1
                            ? 'Pick at least one branch to compare.'
                            : runIsStale
                              ? 'Filters changed — re-run to refresh.'
                              : 'Up to date.'}
                    </p>
                    <Button
                        type="button"
                        onClick={actions.run}
                        disabled={
                            filters.selectedIds.length < 1 ||
                            isFetching ||
                            !runIsStale
                        }
                    >
                        <GitCompareArrows size={14} />
                        {isFetching ? 'Running…' : 'Run comparison'}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
