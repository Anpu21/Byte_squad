import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { cn, formatCurrency } from "@/lib/utils";
import type { ICustomerAnalyticsSegment } from "@/types";

const SEGMENT_BAR: Record<string, string> = {
  Champion: "bg-accent",
  Loyal: "bg-primary",
  New: "bg-info",
  "At risk": "bg-warning",
  Dormant: "bg-text-3",
  Prospect: "bg-border-strong",
};

export function CustomerSegmentBreakdown({
  segments,
  totalCustomers,
}: {
  segments: ICustomerAnalyticsSegment[];
  totalCustomers: number;
}) {
  const max = Math.max(1, ...segments.map((s) => s.count));

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-text-1">RFM segments</h3>
      {segments.length === 0 ? (
        <EmptyState title="No customers yet" className="py-6" />
      ) : (
        <ul className="space-y-3.5">
          {segments.map((s) => {
            const pct =
              totalCustomers > 0
                ? Math.round((s.count / totalCustomers) * 100)
                : 0;
            return (
              <li key={s.segment}>
                <div className="mb-1 flex items-baseline justify-between gap-3 text-[12.5px]">
                  <span className="font-medium text-text-1">{s.segment}</span>
                  <span className="text-text-3">
                    {s.count} · {pct}% · {formatCurrency(s.revenue)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      SEGMENT_BAR[s.segment] ?? "bg-primary",
                    )}
                    style={{ width: `${(s.count / max) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
