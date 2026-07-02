import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { count, money } from "../../lib/format-cells";
import { MultiBranchBarChart } from "@/components/charts/MultiBranchBarChart";
import { BranchMetricTable } from "../BranchMetricTable";

export function LoyaltyView({
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
