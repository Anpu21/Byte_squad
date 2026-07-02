import { chartValue } from "./chart-format";

export interface ChartRow {
  name: string;
  [key: string]: number | string;
}

interface TooltipPayload {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: ChartRow;
}

export interface TooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
}

export function ChartTooltip({ active, label, payload }: TooltipProps) {
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
