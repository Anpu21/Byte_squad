import Segmented from "@/components/ui/Segmented";
import type {
  IBranchAnalyticsComparisonResponse,
  IBranchAnalyticsTrend,
} from "@/types";
import type { LeaderboardRow } from "../hooks/useBranchComparisonPage";
import { type ComparisonView, type MetricKey } from "../lib/format";
import { METRIC_OPTIONS } from "../lib/metric-options";
import { BranchKpiStrip } from "./BranchKpiStrip";
import { ViewTabs } from "./ViewTabs";
import { SummaryView } from "./views/SummaryView";
import { SalesView } from "./views/SalesView";
import { ProductsView } from "./views/ProductsView";
import { InventoryView } from "./views/InventoryView";
import { LoyaltyView } from "./views/LoyaltyView";
import { CustomersView } from "./views/CustomersView";
import { PaymentsView } from "./views/PaymentsView";
import { StaffView } from "./views/StaffView";

interface BranchComparisonResultsProps {
  comparison: IBranchAnalyticsComparisonResponse;
  leaderboard: LeaderboardRow[];
  metric: MetricKey;
  setMetric: (m: MetricKey) => void;
  view: ComparisonView;
  setView: (view: ComparisonView) => void;
  chartData: {
    name: string;
    Revenue: number;
    Expenses: number;
    Profit: number;
  }[];
  trend: IBranchAnalyticsTrend | undefined;
  branchColors: Record<string, string>;
  revenueSpark: number[];
  selectedBranchNames: string[];
  embedded: boolean;
  isRefreshing: boolean;
}

export function BranchComparisonResults({
  comparison,
  leaderboard,
  metric,
  setMetric,
  view,
  setView,
  chartData,
  trend,
  branchColors,
  revenueSpark,
  selectedBranchNames,
  embedded,
  isRefreshing,
}: BranchComparisonResultsProps) {
  const branchCount = comparison.branches.length;
  return (
    <>
      {!embedded && view === "summary" && (
        <div className="mb-4 flex md:hidden">
          <Segmented
            value={metric}
            options={METRIC_OPTIONS}
            onChange={setMetric}
          />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-text-2">
          {selectedBranchNames.length > 0 ? (
            <>
              Comparing{" "}
              <span className="font-medium text-text-1">
                {selectedBranchNames.join(", ")}
              </span>
            </>
          ) : (
            "No branches selected"
          )}
        </div>
        {isRefreshing && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary-soft-text">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            Updating dashboard
          </span>
        )}
      </div>

      <BranchKpiStrip comparison={comparison} revenueSpark={revenueSpark} />

      <ViewTabs value={view} onChange={setView} />

      {view === "summary" && (
        <SummaryView
          comparison={comparison}
          leaderboard={leaderboard}
          metric={metric}
          chartData={chartData}
          trend={trend}
          branchColors={branchColors}
        />
      )}
      {view === "sales" && <SalesView branches={comparison.branches} />}
      {view === "products" && (
        <ProductsView comparison={comparison} branchColors={branchColors} />
      )}
      {view === "inventory" && <InventoryView branches={comparison.branches} />}
      {view === "loyalty" && <LoyaltyView branches={comparison.branches} />}
      {view === "customers" && <CustomersView branches={comparison.branches} />}
      {view === "payments" && <PaymentsView branches={comparison.branches} />}
      {view === "staff" && <StaffView branches={comparison.branches} />}

      <p className="mt-4 text-[11px] text-text-3">
        {branchCount} {branchCount === 1 ? "branch" : "branches"} in this
        comparison.
      </p>
    </>
  );
}
