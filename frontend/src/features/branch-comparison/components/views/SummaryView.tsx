import type { IBranchAnalyticsComparisonResponse } from "@/types";
import type { LeaderboardRow } from "../../hooks/useBranchComparisonPage";
import type { MetricKey } from "../../lib/format";
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
}) {
  const branchCount = comparison.branches.length;
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <BranchRankingChart rows={leaderboard} />
        <ProfitabilityScatter branches={comparison.branches} />
      </div>

      <BranchLeaderboard rows={leaderboard} metric={metric} />

      <RevenueVsExpensesChart data={chartData} branchCount={branchCount} />

      {branchCount >= 2 ? (
        <TopProductsComparator branches={comparison.branches} />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {comparison.branches.map((branch) => (
            <TopProductsByBranch key={branch.branchId} entry={branch} />
          ))}
        </div>
      )}
    </>
  );
}
