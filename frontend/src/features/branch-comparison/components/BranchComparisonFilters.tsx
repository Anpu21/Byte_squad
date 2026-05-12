import { GitCompareArrows, X } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { IBranch } from '@/types';

export interface BranchComparisonFilterValues {
    selectedIds: string[];
    startDate: string;
    endDate: string;
}

export interface BranchComparisonFilterActions {
    toggleBranch: (id: string) => void;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    run: () => void;
}

interface BranchComparisonFiltersProps {
    branches: IBranch[];
    filters: BranchComparisonFilterValues;
    actions: BranchComparisonFilterActions;
    isFetching: boolean;
}

const INPUT_CLASS =
    'w-full h-9 px-3 bg-surface border border-border-strong rounded-md text-sm text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-colors';

export function BranchComparisonFilters({
    branches,
    filters,
    actions,
    isFetching,
}: BranchComparisonFiltersProps) {
    return (
        <Card className="p-5 mb-6">
            <div className="flex flex-col gap-4">
                <div>
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold mb-2">
                        Branches
                    </span>
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
                                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border transition-colors ${
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            onChange={(e) => actions.setEndDate(e.target.value)}
                            className={INPUT_CLASS}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            type="button"
                            onClick={actions.run}
                            disabled={
                                filters.selectedIds.length < 1 || isFetching
                            }
                            className="w-full"
                        >
                            <GitCompareArrows size={14} />
                            {isFetching ? 'Running…' : 'Run comparison'}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
