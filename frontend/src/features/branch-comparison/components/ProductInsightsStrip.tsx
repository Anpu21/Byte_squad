import { cn } from "@/lib/utils";
import type { InsightAccent, ProductInsight } from "./products-insights";

const valueTint: Record<InsightAccent, string> = {
  primary: "text-text-1",
  accent: "text-accent-text",
  info: "text-info",
  warning: "text-warning",
};

/**
 * "Key points & differences" strip — KpiCard-styled tiles, but with a
 * text-sized value (product / branch names, not big mono numbers). Page-scoped
 * highlights from `buildProductInsights`.
 */
export function ProductInsightsStrip({
  insights,
}: {
  insights: ProductInsight[];
}) {
  if (insights.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {insights.map((insight) => (
        <div
          key={insight.key}
          className="rounded-lg border border-border bg-surface p-5 shadow-sm-token"
        >
          <div className="mono text-[11px] font-semibold uppercase tracking-[0.1em] text-text-3">
            {insight.label}
          </div>
          <div
            className={cn(
              "mt-2 truncate text-[17px] font-bold tracking-[-0.01em]",
              valueTint[insight.accent],
            )}
            title={insight.value}
          >
            {insight.value}
          </div>
          <div className="mt-1 text-[12px] text-text-3">{insight.note}</div>
        </div>
      ))}
    </div>
  );
}
