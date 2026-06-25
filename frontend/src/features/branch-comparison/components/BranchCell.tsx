import Pill from "@/components/ui/Pill";
import type { IBranchAnalyticsComparisonEntry } from "@/types";

export function BranchCell({ entry }: { entry: IBranchAnalyticsComparisonEntry }) {
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
