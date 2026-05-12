import { GitCompareArrows } from 'lucide-react';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';
import { useBranchComparisonPage } from '@/features/branch-comparison/hooks/useBranchComparisonPage';
import { BranchComparisonFilters } from '@/features/branch-comparison/components/BranchComparisonFilters';
import { BranchComparisonResults } from '@/features/branch-comparison/components/BranchComparisonResults';
import { formatDateRange } from '@/features/branch-comparison/lib/format';
import { METRIC_OPTIONS } from '@/features/branch-comparison/lib/metric-options';

interface BranchComparisonPageProps {
    embedded?: boolean;
}

export function BranchComparisonPage({
    embedded = false,
}: BranchComparisonPageProps = {}) {
    const p = useBranchComparisonPage();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!embedded && (
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                            Compare branches
                        </h1>
                        <p className="text-xs text-text-2 mt-1">
                            {formatDateRange(p.startDate, p.endDate)}
                        </p>
                    </div>
                    {p.comparison && (
                        <Segmented
                            value={p.metric}
                            options={METRIC_OPTIONS}
                            onChange={p.setMetric}
                        />
                    )}
                </div>
            )}

            <BranchComparisonFilters
                branches={p.branches}
                selectedIds={p.selectedIds}
                onToggleBranch={p.toggleBranch}
                startDate={p.startDate}
                setStartDate={p.setStartDate}
                endDate={p.endDate}
                setEndDate={p.setEndDate}
                isFetching={p.isFetching}
                onRun={p.handleRun}
            />

            {!p.submitted && (
                <Card>
                    <EmptyState
                        icon={<GitCompareArrows size={20} />}
                        title="Select branches to compare"
                        description="Pick at least one branch above and click Run comparison."
                    />
                </Card>
            )}

            {p.submitted && p.isLoading && (
                <div className="flex items-center justify-center py-24">
                    <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
                </div>
            )}

            {p.comparison && !p.isLoading && (
                <BranchComparisonResults
                    comparison={p.comparison}
                    metric={p.metric}
                    setMetric={p.setMetric}
                    chartData={p.chartData}
                    selectedBranchNames={p.selectedBranchNames}
                    embedded={embedded}
                />
            )}
        </div>
    );
}
