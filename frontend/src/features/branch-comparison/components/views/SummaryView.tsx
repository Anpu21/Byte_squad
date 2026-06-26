import type {
  IBranchAnalyticsComparisonResponse,
  IBranchAnalyticsTrend,
} from "@/types";
import type { LeaderboardRow } from "../../hooks/useBranchComparisonPage";
import type { MetricKey } from "../../lib/format";
import { DailyRevenueTrend } from "../charts/DailyRevenueTrend";
import { BranchRankingChart } from "../charts/BranchRankingChart";
import { ProfitabilityScatter } from "../charts/ProfitabilityScatter";
import { BranchLeaderboard } from "../BranchLeaderboard";
import { RevenueVsExpensesChart } from "../RevenueVsExpensesChart";
import { TopProductsByBranch } from "../TopProductsByBranch";
import { TopProductsComparator } from "../TopProductsComparator";

export function SummaryView({
  comparison,
  leaderboard,
  metric,
  chartData,
  trend,
  branchColors,
}: {
  comparison: IBranchAnalyticsComparisonResponse;
  leaderboard: LeaderboardRow[];
  metric: MetricKey;
  chartData: {
    name: string;
    Revenue: number;
    Expenses: number;
    Profit: number;
  }[];
  trend: IBranchAnalyticsTrend | undefined;
  branchColors: Record<string, string>;
}) {
  const branchCount = comparison.branches.length;
  return (
    <>
      <DailyRevenueTrend trend={trend} branchColors={branchColors} />

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BranchRankingChart rows={leaderboard} branchColors={branchColors} />
        <ProfitabilityScatter
          branches={comparison.branches}
          branchColors={branchColors}
        />
      </div>

      <BranchLeaderboard
        rows={leaderboard}
        metric={metric}
        branchColors={branchColors}
      />

      <RevenueVsExpensesChart data={chartData} branchCount={branchCount} />

      {branchCount >= 2 ? (
        <TopProductsComparator
          branches={comparison.branches}
          branchColors={branchColors}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {comparison.branches.map((branch) => (
            <TopProductsByBranch
              key={branch.branchId}
              entry={branch}
              branchColors={branchColors}
            />
          ))}
        </div>
      )}
    </>
  );
}
