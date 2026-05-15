import { useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '@/components/ui/Card';
import Segmented from '@/components/ui/Segmented';
import EmptyState from '@/components/ui/EmptyState';
import PageHeader from '@/components/ui/PageHeader';
import ExportMenu from '@/components/common/ExportMenu';
import { exportData, type ExportFormat } from '@/lib/exportUtils';
import { useBranchComparisonPage } from '@/features/branch-comparison/hooks/useBranchComparisonPage';
import { BranchComparisonFilters } from '@/features/branch-comparison/components/BranchComparisonFilters';
import { BranchComparisonResults } from '@/features/branch-comparison/components/BranchComparisonResults';
import { formatDateRange } from '@/features/branch-comparison/lib/format';
import { METRIC_OPTIONS } from '@/features/branch-comparison/lib/metric-options';
import { buildComparisonExport } from '@/features/branch-comparison/lib/export-comparison';

interface BranchComparisonPageProps {
    embedded?: boolean;
}

function ResultsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse" aria-hidden="true">
            <div className="rounded-md border border-border bg-surface overflow-hidden">
                <div className="h-11 bg-surface-2/60 border-b border-border" />
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0"
                    >
                        <div className="w-7 h-7 rounded-full bg-surface-2" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-36 bg-surface-2 rounded" />
                            <div className="h-1.5 w-full bg-surface-2 rounded-full" />
                            <div className="h-2.5 w-2/3 bg-surface-2 rounded" />
                        </div>
                        <div className="space-y-2 text-right">
                            <div className="h-5 w-24 bg-surface-2 rounded ml-auto" />
                            <div className="h-2.5 w-16 bg-surface-2 rounded ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="h-80 rounded-md border border-border bg-surface" />
            <div className="h-60 rounded-md border border-border bg-surface" />
        </div>
    );
}

export function BranchComparisonPage({
    embedded = false,
}: BranchComparisonPageProps = {}) {
    const p = useBranchComparisonPage();
    const [isExporting, setIsExporting] = useState(false);

    const canExport = p.leaderboard.length > 0 && !p.isFetching;

    async function handleExport(format: ExportFormat) {
        if (!canExport) return;
        setIsExporting(true);
        try {
            const payload = buildComparisonExport({
                rows: p.leaderboard,
                startDate: p.startDate,
                endDate: p.endDate,
                totals: p.totals,
            });
            await exportData(
                format,
                payload.rows,
                payload.columns,
                payload.meta,
            );
            toast.success(
                format === 'pdf'
                    ? 'PDF download started'
                    : 'Excel download started',
            );
        } catch {
            toast.error('Failed to export comparison.');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!embedded && (
                <PageHeader
                    eyebrow="Admin"
                    title="Compare branches"
                    subtitle={formatDateRange(p.startDate, p.endDate)}
                    actions={
                        <div className="flex items-center gap-2">
                            {p.comparison && (
                                <div className="hidden md:block">
                                    <Segmented
                                        value={p.metric}
                                        options={METRIC_OPTIONS}
                                        onChange={p.setMetric}
                                    />
                                </div>
                            )}
                            <ExportMenu
                                disabled={!canExport}
                                isPreparing={isExporting}
                                onExport={handleExport}
                            />
                        </div>
                    }
                />
            )}

            <BranchComparisonFilters
                branches={p.branches}
                filters={{
                    selectedIds: p.selectedIds,
                    startDate: p.startDate,
                    endDate: p.endDate,
                    activePreset: p.activePreset,
                }}
                actions={{
                    toggleBranch: p.toggleBranch,
                    selectAllBranches: p.selectAllBranches,
                    clearBranches: p.clearBranches,
                    setPreset: p.setPreset,
                    setStartDate: p.setStartDate,
                    setEndDate: p.setEndDate,
                    run: p.handleRun,
                }}
                isFetching={p.isFetching}
                runIsStale={p.runIsStale}
            />

            {!p.submitted && (
                <Card>
                    <EmptyState
                        icon={<GitCompareArrows size={20} />}
                        title="Select branches to compare"
                        description="Pick at least one branch above, choose a date range, then click Run comparison."
                    />
                </Card>
            )}

            {p.submitted && p.isLoading && <ResultsSkeleton />}

            {p.comparison && !p.isLoading && (
                <BranchComparisonResults
                    comparison={p.comparison}
                    leaderboard={p.leaderboard}
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
