import Segmented from '@/components/ui/Segmented';
import type { IBranchComparisonResponse } from '@/types';
import type { LeaderboardRow } from '../hooks/useBranchComparisonPage';
import type { MetricKey } from '../lib/format';
import { METRIC_OPTIONS } from '../lib/metric-options';
import { BranchLeaderboard } from './BranchLeaderboard';
import { RevenueVsExpensesChart } from './RevenueVsExpensesChart';
import { TopProductsByBranch } from './TopProductsByBranch';
import { TopProductsComparator } from './TopProductsComparator';

interface BranchComparisonResultsProps {
    comparison: IBranchComparisonResponse;
    leaderboard: LeaderboardRow[];
    metric: MetricKey;
    setMetric: (m: MetricKey) => void;
    chartData: { name: string; Revenue: number; Expenses: number }[];
    selectedBranchNames: string[];
    embedded: boolean;
}

export function BranchComparisonResults({
    comparison,
    leaderboard,
    metric,
    setMetric,
    chartData,
    selectedBranchNames,
    embedded,
}: BranchComparisonResultsProps) {
    const branchCount = comparison.branches.length;
    return (
        <>
            {!embedded && (
                <div className="flex md:hidden mb-4">
                    <Segmented
                        value={metric}
                        options={METRIC_OPTIONS}
                        onChange={setMetric}
                    />
                </div>
            )}

            {selectedBranchNames.length > 0 && (
                <div className="text-xs text-text-2 mb-4">
                    Comparing{' '}
                    <span className="text-text-1 font-medium">
                        {selectedBranchNames.join(', ')}
                    </span>
                </div>
            )}

            <BranchLeaderboard rows={leaderboard} metric={metric} />

            <RevenueVsExpensesChart
                data={chartData}
                branchCount={branchCount}
            />

            {branchCount >= 2 ? (
                <TopProductsComparator branches={comparison.branches} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {comparison.branches.map((b) => (
                        <TopProductsByBranch key={b.branchId} entry={b} />
                    ))}
                </div>
            )}
        </>
    );
}
