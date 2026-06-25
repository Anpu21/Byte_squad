import type { ReactNode } from "react";
import Card from "@/components/ui/Card";
import type { IBranchAnalyticsComparisonEntry } from "@/types";
import { BranchCell } from "./BranchCell";

interface BranchMetricColumn {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (entry: IBranchAnalyticsComparisonEntry) => ReactNode;
}

export function BranchMetricTable({
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
