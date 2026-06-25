import type { ReactNode } from "react";
import { LuTriangleAlert as AlertTriangle, LuBadgePercent as BadgePercent, LuChartColumnBig as BarChart3, LuBoxes as Boxes, LuCircleDollarSign as CircleDollarSign, LuCreditCard as CreditCard, LuReceiptText as ReceiptText, LuShoppingBag as ShoppingBag, LuTrendingUp as TrendingUp, LuUsersRound as UsersRound, LuWalletCards as WalletCards } from 'react-icons/lu';
import { type IconType as LucideIcon } from 'react-icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import Card from "@/components/ui/Card";
import KpiCard from "@/components/ui/KpiCard";
import Pill from "@/components/ui/Pill";
import Segmented from "@/components/ui/Segmented";
import type {
  IBranchAnalyticsComparisonEntry,
  IBranchAnalyticsComparisonResponse,
} from "@/types";
import type { LeaderboardRow } from "../hooks/useBranchComparisonPage";
import {
  formatCurrencyWhole,
  formatNumber,
  type ComparisonView,
  type MetricKey,
} from "../lib/format";
import { METRIC_OPTIONS } from "../lib/metric-options";
import { BranchLeaderboard } from "./BranchLeaderboard";
import { RevenueVsExpensesChart } from "./RevenueVsExpensesChart";
import { TopProductsByBranch } from "./TopProductsByBranch";
import { TopProductsComparator } from "./TopProductsComparator";

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
  selectedBranchNames: string[];
  embedded: boolean;
  isRefreshing: boolean;
}

interface ViewOption {
  value: ComparisonView;
  label: string;
  Icon: LucideIcon;
}

interface BranchMetricColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (entry: IBranchAnalyticsComparisonEntry) => ReactNode;
}

interface ChartBarDef {
  key: string;
  label: string;
  color: string;
  stackId?: string;
}

interface ChartRow {
  name: string;
  [key: string]: number | string;
}

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: ChartRow;
}

interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: "summary", label: "Summary", Icon: BarChart3 },
  { value: "sales", label: "Sales", Icon: ReceiptText },
  { value: "inventory", label: "Inventory", Icon: Boxes },
  { value: "loyalty", label: "Loyalty", Icon: BadgePercent },
  { value: "customers", label: "Customers", Icon: ShoppingBag },
  { value: "payments", label: "Payments", Icon: CreditCard },
  { value: "staff", label: "Staff", Icon: UsersRound },
];

const CHART_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "var(--warning)",
  "var(--info)",
  "var(--danger)",
  "var(--brand-400)",
];

function compactNumber(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}k`;
  }
  return value.toLocaleString();
}

function compactCurrency(value: number): string {
  return `Rs ${compactNumber(value)}`;
}

function chartValue(value: number | string | undefined): string {
  if (typeof value === "number") return compactNumber(value);
  return value ? String(value) : "0";
}

function ChartTooltip({ active, label, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const fallbackLabel = payload.find(
    (item) => typeof item.payload?.name === "string",
  )?.payload?.name;
  const title = label ?? fallbackLabel ?? "Details";

  return (
    <div className="rounded-md border border-border bg-surface p-3 shadow-md-token">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-3">
        {title}
      </p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={`${item.name ?? "metric"}-${item.color ?? ""}`}
            className="flex min-w-[160px] items-center justify-between gap-4 text-[12px]"
          >
            <span className="flex items-center gap-1.5 text-text-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="mono font-semibold text-text-1">
              {chartValue(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold tracking-tight text-text-1">
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] text-text-3">{description}</p>
      </div>
      {children}
    </Card>
  );
}

function BranchKpiStrip({
  comparison,
}: {
  comparison: IBranchAnalyticsComparisonResponse;
}) {
  const totals = comparison.totals;
  const stockRisk =
    totals.inventory.lowStockItems + totals.inventory.outOfStockItems;
  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      <KpiCard
        label="Revenue"
        value={formatCurrencyWhole(totals.financial.revenue)}
        delta={`${formatNumber(totals.sales.transactionCount)} bills`}
        icon={<CircleDollarSign size={14} />}
      />
      <KpiCard
        label="Gross profit"
        value={formatCurrencyWhole(totals.financial.grossProfit)}
        delta={`${(totals.financial.expenseRatio * 100).toFixed(1)}% expense`}
        deltaPositive={totals.financial.grossProfit >= 0}
        icon={<TrendingUp size={14} />}
      />
      <KpiCard
        label="AOV"
        value={formatCurrencyWhole(totals.sales.avgTransactionValue)}
        delta="Across selected branches"
        icon={<ReceiptText size={14} />}
      />
      <KpiCard
        label="Inventory risk"
        value={formatNumber(stockRisk)}
        delta={`${formatNumber(totals.inventory.outOfStockItems)} out`}
        deltaPositive={stockRisk === 0}
        icon={<AlertTriangle size={14} />}
      />
      <KpiCard
        label="Loyalty liability"
        value={formatCurrencyWhole(totals.loyalty.liabilityValue)}
        delta={`${formatNumber(totals.loyalty.activeMembers)} members`}
        icon={<WalletCards size={14} />}
      />
      <KpiCard
        label="Pickup orders"
        value={formatNumber(totals.customers.pickupOrders)}
        delta={`${formatNumber(totals.customers.completedOrders)} done`}
        icon={<ShoppingBag size={14} />}
      />
    </div>
  );
}

function BranchRankingChart({ rows }: { rows: LeaderboardRow[] }) {
  const data = [...rows]
    .sort((a, b) => b.value - a.value)
    .map((row) => ({
      name: row.entry.branchName,
      value: row.value,
    }));
  return (
    <ChartCard
      title="Branch ranking"
      description="Selected leaderboard metric across compared branches."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 12 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={compactNumber}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: "var(--text-2)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              name="Metric"
              dataKey="value"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function MultiBranchBarChart({
  title,
  description,
  data,
  bars,
  stacked = false,
  valueType = "number",
}: {
  title: string;
  description: string;
  data: ChartRow[];
  bars: ChartBarDef[];
  stacked?: boolean;
  valueType?: "number" | "currency";
}) {
  const formatter = valueType === "currency" ? compactCurrency : compactNumber;
  return (
    <ChartCard title={title} description={description}>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatter}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{
                color: "var(--text-2)",
                fontSize: 12,
                paddingTop: 8,
              }}
            />
            {bars.map((bar, idx) => (
              <Bar
                key={bar.key}
                name={bar.label}
                dataKey={bar.key}
                fill={bar.color}
                stackId={stacked ? "branch" : bar.stackId}
                radius={idx === bars.length - 1 ? [4, 4, 0, 0] : 0}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function ProfitabilityScatter({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    revenue: branch.financial.revenue,
    expenseRatio: Number((branch.financial.expenseRatio * 100).toFixed(2)),
    profit: branch.financial.grossProfit,
  }));
  return (
    <ChartCard
      title="Profitability quadrant"
      description="Revenue scale against expense pressure."
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="revenue"
              name="Revenue"
              tickFormatter={compactCurrency}
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="expenseRatio"
              name="Expense ratio"
              unit="%"
              tick={{ fill: "var(--text-3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <ZAxis dataKey="profit" range={[80, 360]} />
            <Tooltip content={<ChartTooltip />} />
            <Scatter name="Branches" data={data} fill="var(--primary)">
              {data.map((row, idx) => (
                <Cell
                  key={row.name}
                  fill={CHART_COLORS[idx % CHART_COLORS.length]}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function ViewTabs({
  value,
  onChange,
}: {
  value: ComparisonView;
  onChange: (view: ComparisonView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Branch comparison views"
      className="mb-4 flex gap-1 overflow-x-auto rounded-md border border-border bg-surface-2 p-1"
    >
      {VIEW_OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(optionValue)}
            className={`inline-flex h-8 flex-shrink-0 items-center gap-1.5 rounded px-3 text-xs font-semibold transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/30 ${
              active
                ? "bg-surface text-text-1 shadow-xs"
                : "text-text-2 hover:bg-surface hover:text-text-1"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function BranchCell({ entry }: { entry: IBranchAnalyticsComparisonEntry }) {
  return (
    <div className="flex min-w-[180px] items-center gap-2">
      <span className="truncate font-semibold text-text-1">
        {entry.branchName}
      </span>
      {entry.isOwnBranch && (
        <Pill tone="primary" dot={false}>
          Own
        </Pill>
      )}
    </div>
  );
}

function BranchMetricTable({
  title,
  description,
  branches,
  columns,
}: {
  title: string;
  description: string;
  branches: IBranchAnalyticsComparisonEntry[];
  columns: BranchMetricColumn[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3.5">
        <h3 className="text-[14px] font-semibold tracking-tight text-text-1">
          {title}
        </h3>
        <p className="mt-0.5 text-[11px] text-text-3">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-2 text-[11px] uppercase tracking-[0.08em] text-text-3">
              <th className="px-5 py-2.5 font-semibold">Branch</th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-2.5 font-semibold whitespace-nowrap ${
                    column.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr
                key={branch.branchId}
                className="border-t border-border transition-colors hover:bg-surface-2/40"
              >
                <td className="px-5 py-3 text-[13px]">
                  <BranchCell entry={branch} />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-[13px] text-text-1 whitespace-nowrap ${
                      column.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    {column.render(branch)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function money(value: number) {
  return (
    <span className="mono font-semibold tabular-nums">
      {formatCurrencyWhole(value)}
    </span>
  );
}

function count(value: number, digits = 0) {
  return (
    <span className="mono font-semibold tabular-nums">
      {formatNumber(value, digits)}
    </span>
  );
}

function SummaryView({
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

function SalesView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    revenue: branch.financial.revenue,
    expenses: branch.financial.expenses,
    profit: branch.financial.grossProfit,
    transactions: branch.sales.transactionCount,
  }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MultiBranchBarChart
          title="Revenue, expenses, profit"
          description="Core financial comparison by branch."
          data={data}
          valueType="currency"
          bars={[
            {
              key: "revenue",
              label: "Revenue",
              color: "var(--primary)",
            },
            {
              key: "expenses",
              label: "Expenses",
              color: "var(--warning)",
            },
            {
              key: "profit",
              label: "Profit",
              color: "var(--accent)",
            },
          ]}
        />
        <MultiBranchBarChart
          title="Transaction volume"
          description="Completed sale count per branch."
          data={data}
          bars={[
            {
              key: "transactions",
              label: "Transactions",
              color: "var(--info)",
            },
          ]}
        />
      </div>
      <BranchMetricTable
        title="Sales performance"
        description="Revenue, profit, transaction volume, and checkout adjustments."
        branches={branches}
        columns={[
          {
            key: "revenue",
            header: "Revenue",
            align: "right",
            render: (branch) => money(branch.financial.revenue),
          },
          {
            key: "profit",
            header: "Profit",
            align: "right",
            render: (branch) => money(branch.financial.grossProfit),
          },
          {
            key: "transactions",
            header: "Transactions",
            align: "right",
            render: (branch) => count(branch.sales.transactionCount),
          },
          {
            key: "aov",
            header: "AOV",
            align: "right",
            render: (branch) => money(branch.sales.avgTransactionValue),
          },
          {
            key: "discounts",
            header: "Discounts",
            align: "right",
            render: (branch) => money(branch.sales.discountTotal),
          },
          {
            key: "tax",
            header: "Tax",
            align: "right",
            render: (branch) => money(branch.sales.taxTotal),
          },
        ]}
      />
      {branches.length >= 2 ? (
        <TopProductsComparator branches={branches} />
      ) : (
        branches.map((branch) => (
          <TopProductsByBranch key={branch.branchId} entry={branch} />
        ))
      )}
    </div>
  );
}

function InventoryView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    active: branch.inventory.activeProducts,
    low: branch.inventory.lowStockItems,
    out: branch.inventory.outOfStockItems,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Inventory status"
        description="Active, low-stock, and out-of-stock products by branch."
        data={data}
        stacked
        bars={[
          {
            key: "active",
            label: "Active",
            color: "var(--primary)",
          },
          {
            key: "low",
            label: "Low stock",
            color: "var(--warning)",
          },
          {
            key: "out",
            label: "Out",
            color: "var(--danger)",
          },
        ]}
      />
      <BranchMetricTable
        title="Inventory health"
        description="Current inventory state for active products in each branch."
        branches={branches}
        columns={[
          {
            key: "active",
            header: "Active products",
            align: "right",
            render: (branch) => count(branch.inventory.activeProducts),
          },
          {
            key: "low",
            header: "Low stock",
            align: "right",
            render: (branch) => count(branch.inventory.lowStockItems),
          },
          {
            key: "out",
            header: "Out of stock",
            align: "right",
            render: (branch) => count(branch.inventory.outOfStockItems),
          },
          {
            key: "quantity",
            header: "Stock qty",
            align: "right",
            render: (branch) => count(branch.inventory.totalStockQuantity, 3),
          },
        ]}
      />
    </div>
  );
}

function LoyaltyView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const movementData = branches.map((branch) => ({
    name: branch.branchName,
    earned: branch.loyalty.pointsEarned,
    redeemed: branch.loyalty.pointsRedeemed,
    reversed: branch.loyalty.pointsReversed,
  }));
  const channelData = branches.map((branch) => ({
    name: branch.branchName,
    physical: branch.loyalty.channelSplit.physicalPoints,
    online: branch.loyalty.channelSplit.onlinePoints,
  }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MultiBranchBarChart
          title="Points movement"
          description="Earned, redeemed, and reversed points."
          data={movementData}
          bars={[
            {
              key: "earned",
              label: "Earned",
              color: "var(--accent)",
            },
            {
              key: "redeemed",
              label: "Redeemed",
              color: "var(--primary)",
            },
            {
              key: "reversed",
              label: "Reversed",
              color: "var(--danger)",
            },
          ]}
        />
        <MultiBranchBarChart
          title="Physical vs online"
          description="Points by customer channel."
          data={channelData}
          stacked
          bars={[
            {
              key: "physical",
              label: "Physical",
              color: "var(--primary)",
            },
            {
              key: "online",
              label: "Online",
              color: "var(--info)",
            },
          ]}
        />
      </div>
      <BranchMetricTable
        title="Loyalty movement"
        description="Branch-level earn/redeem activity and current points liability."
        branches={branches}
        columns={[
          {
            key: "members",
            header: "Members",
            align: "right",
            render: (branch) => count(branch.loyalty.activeMembers),
          },
          {
            key: "earned",
            header: "Earned",
            align: "right",
            render: (branch) => count(branch.loyalty.pointsEarned),
          },
          {
            key: "redeemed",
            header: "Redeemed",
            align: "right",
            render: (branch) => count(branch.loyalty.pointsRedeemed),
          },
          {
            key: "reversed",
            header: "Reversed",
            align: "right",
            render: (branch) => count(branch.loyalty.pointsReversed),
          },
          {
            key: "liability",
            header: "Liability",
            align: "right",
            render: (branch) => money(branch.loyalty.liabilityValue),
          },
          {
            key: "physical",
            header: "Physical pts",
            align: "right",
            render: (branch) =>
              count(branch.loyalty.channelSplit.physicalPoints),
          },
          {
            key: "online",
            header: "Online pts",
            align: "right",
            render: (branch) => count(branch.loyalty.channelSplit.onlinePoints),
          },
          {
            key: "tiers",
            header: "B / S / G",
            align: "right",
            render: (branch) => (
              <span className="mono font-semibold tabular-nums">
                {branch.loyalty.tierCounts.bronze} /{" "}
                {branch.loyalty.tierCounts.silver} /{" "}
                {branch.loyalty.tierCounts.gold}
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}

function CustomersView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    completed: branch.customers.completedOrders,
    cancelled: branch.customers.cancelledOrders,
    rejected: branch.customers.rejectedOrders,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Pickup order outcomes"
        description="Completed, cancelled, and rejected pickup orders."
        data={data}
        stacked
        bars={[
          {
            key: "completed",
            label: "Completed",
            color: "var(--accent)",
          },
          {
            key: "cancelled",
            label: "Cancelled",
            color: "var(--warning)",
          },
          {
            key: "rejected",
            label: "Rejected",
            color: "var(--danger)",
          },
        ]}
      />
      <BranchMetricTable
        title="Customer orders"
        description="Pickup order outcomes and unique customers in the selected period."
        branches={branches}
        columns={[
          {
            key: "pickup",
            header: "Pickup orders",
            align: "right",
            render: (branch) => count(branch.customers.pickupOrders),
          },
          {
            key: "completed",
            header: "Completed",
            align: "right",
            render: (branch) => count(branch.customers.completedOrders),
          },
          {
            key: "cancelled",
            header: "Cancelled",
            align: "right",
            render: (branch) => count(branch.customers.cancelledOrders),
          },
          {
            key: "rejected",
            header: "Rejected",
            align: "right",
            render: (branch) => count(branch.customers.rejectedOrders),
          },
          {
            key: "unique",
            header: "Unique customers",
            align: "right",
            render: (branch) => count(branch.customers.uniqueCustomers),
          },
        ]}
      />
    </div>
  );
}

function PaymentsView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const data = branches.map((branch) => ({
    name: branch.branchName,
    cash: branch.payments.cashAmount,
    card: branch.payments.cardAmount,
    mobile: branch.payments.mobileAmount,
    cheque: branch.payments.chequeAmount,
    bank: branch.payments.bankAmount,
    credit: branch.payments.creditAmount,
  }));
  return (
    <div className="space-y-4">
      <MultiBranchBarChart
        title="Tender mix"
        description="Stacked payment amount by method."
        data={data}
        stacked
        valueType="currency"
        bars={[
          { key: "cash", label: "Cash", color: "var(--primary)" },
          { key: "card", label: "Card", color: "var(--accent)" },
          { key: "mobile", label: "Mobile", color: "var(--info)" },
          { key: "cheque", label: "Cheque", color: "var(--warning)" },
          {
            key: "bank",
            label: "Bank",
            color: "var(--brand-400)",
          },
          { key: "credit", label: "Credit", color: "var(--danger)" },
        ]}
      />
      <BranchMetricTable
        title="Payment mix"
        description="Tender split for finalized branch sales."
        branches={branches}
        columns={[
          {
            key: "cash",
            header: "Cash",
            align: "right",
            render: (branch) => money(branch.payments.cashAmount),
          },
          {
            key: "card",
            header: "Card",
            align: "right",
            render: (branch) => money(branch.payments.cardAmount),
          },
          {
            key: "mobile",
            header: "Mobile",
            align: "right",
            render: (branch) => money(branch.payments.mobileAmount),
          },
          {
            key: "cheque",
            header: "Cheque",
            align: "right",
            render: (branch) => money(branch.payments.chequeAmount),
          },
          {
            key: "bank",
            header: "Bank",
            align: "right",
            render: (branch) => money(branch.payments.bankAmount),
          },
          {
            key: "credit",
            header: "Credit",
            align: "right",
            render: (branch) => money(branch.payments.creditAmount),
          },
        ]}
      />
    </div>
  );
}

function StaffView({
  branches,
}: {
  branches: IBranchAnalyticsComparisonEntry[];
}) {
  const productivityData = branches.map((branch) => ({
    name: branch.branchName,
    revenuePerStaff: branch.staff.revenuePerStaff,
  }));
  const scatterData = branches.map((branch) => ({
    name: branch.branchName,
    staff: branch.staff.staffCount,
    revenue: branch.financial.revenue,
    profit: branch.financial.grossProfit,
  }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MultiBranchBarChart
          title="Revenue per staff"
          description="Sales output divided by assigned staff count."
          data={productivityData}
          valueType="currency"
          bars={[
            {
              key: "revenuePerStaff",
              label: "Revenue / staff",
              color: "var(--primary)",
            },
          ]}
        />
        <ChartCard
          title="Staff leverage"
          description="Staff count against revenue scale."
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{
                  top: 8,
                  right: 16,
                  bottom: 8,
                  left: 0,
                }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="staff"
                  name="Staff"
                  tick={{
                    fill: "var(--text-3)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="revenue"
                  name="Revenue"
                  tickFormatter={compactCurrency}
                  tick={{
                    fill: "var(--text-3)",
                    fontSize: 11,
                  }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <ZAxis dataKey="profit" range={[80, 360]} />
                <Tooltip content={<ChartTooltip />} />
                <Scatter
                  name="Branches"
                  data={scatterData}
                  fill="var(--primary)"
                >
                  {scatterData.map((row, idx) => (
                    <Cell
                      key={row.name}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
      <BranchMetricTable
        title="Staff productivity"
        description="Staffing level and sales output per assigned staff member."
        branches={branches}
        columns={[
          {
            key: "staff",
            header: "Staff",
            align: "right",
            render: (branch) => count(branch.staff.staffCount),
          },
          {
            key: "revenue",
            header: "Revenue",
            align: "right",
            render: (branch) => money(branch.financial.revenue),
          },
          {
            key: "profit",
            header: "Profit",
            align: "right",
            render: (branch) => money(branch.financial.grossProfit),
          },
          {
            key: "revStaff",
            header: "Revenue / staff",
            align: "right",
            render: (branch) => money(branch.staff.revenuePerStaff),
          },
        ]}
      />
    </div>
  );
}

export function BranchComparisonResults({
  comparison,
  leaderboard,
  metric,
  setMetric,
  view,
  setView,
  chartData,
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

      <BranchKpiStrip comparison={comparison} />

      <ViewTabs value={view} onChange={setView} />

      {view === "summary" && (
        <SummaryView
          comparison={comparison}
          leaderboard={leaderboard}
          metric={metric}
          chartData={chartData}
        />
      )}
      {view === "sales" && <SalesView branches={comparison.branches} />}
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
