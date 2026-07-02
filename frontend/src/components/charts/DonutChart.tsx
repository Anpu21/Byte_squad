import { useMemo, type ReactNode } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import EmptyState from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

export interface DonutSlice {
    name: string;
    value: number;
    /** CSS colour — pass a brand token (e.g. 'var(--primary)'), never raw hex. */
    color: string;
}

interface DonutChartProps {
    data: DonutSlice[];
    /** Donut box (px). The ring centres in this square; legend sits beside it. */
    size?: number;
    /** Ring thickness (px). */
    thickness?: number;
    centerValue?: ReactNode;
    centerLabel?: ReactNode;
    formatValue?: (value: number) => string;
    showLegend?: boolean;
    /**
     * Legend beside the ring (`row`, default) or stacked full-width below it
     * (`column`) — use column in narrow cards where name + value + percent
     * would otherwise overflow past the card edge.
     */
    layout?: 'row' | 'column';
    emptyLabel?: string;
    className?: string;
}

interface DonutTooltipProps {
    active?: boolean;
    payload?: { name: string; value: number; payload: DonutSlice }[];
    total: number;
    formatter: (v: number) => string;
}

function DonutTooltip({ active, payload, total, formatter }: DonutTooltipProps) {
    if (!active || !payload || !payload.length) return null;
    const slice = payload[0];
    const pct = total > 0 ? (slice.value / total) * 100 : 0;
    return (
        <div className="bg-surface border border-border rounded-md shadow-md-token p-2.5">
            <div className="flex items-center gap-2">
                <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ background: slice.payload.color }}
                />
                <span className="text-[12px] font-medium text-text-2">
                    {slice.name}
                </span>
            </div>
            <p className="mono text-[13px] font-semibold text-text-1 mt-1">
                {formatter(slice.value)}
                <span className="text-text-3 font-medium"> · {pct.toFixed(1)}%</span>
            </p>
        </div>
    );
}

/**
 * Donut/pie chart with an optional centre label and a value+percent legend.
 * Built on Recharts `PieChart`; slice fills are caller-supplied brand tokens
 * (so dark mode recolours automatically) and a `var(--surface)` separator ring
 * keeps adjacent slices readable in both themes. Renders an `EmptyState` when
 * the data is empty or sums to zero.
 */
export default function DonutChart({
    data,
    size = 132,
    thickness = 22,
    centerValue,
    centerLabel,
    formatValue = (v) => v.toLocaleString(),
    showLegend = true,
    layout = 'row',
    emptyLabel = 'No data for this period',
    className,
}: DonutChartProps) {
    // Re-render on theme change so the CSS-var fills refresh.
    useTheme();
    const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);

    if (!data.length || total <= 0) {
        return <EmptyState title={emptyLabel} className="py-8" />;
    }

    const outerRadius = size / 2 - 2;
    const innerRadius = Math.max(outerRadius - thickness, 0);

    return (
        <div
            className={cn(
                'flex items-center gap-5',
                layout === 'column' && 'flex-col',
                className,
            )}
        >
            <div
                className="relative flex-none"
                style={{ width: size, height: size }}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            paddingAngle={2}
                            cornerRadius={3}
                            stroke="var(--surface)"
                            strokeWidth={2}
                            startAngle={90}
                            endAngle={-270}
                            isAnimationActive={false}
                        >
                            {data.map((slice) => (
                                <Cell key={slice.name} fill={slice.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            content={
                                <DonutTooltip
                                    total={total}
                                    formatter={formatValue}
                                />
                            }
                        />
                    </PieChart>
                </ResponsiveContainer>
                {(centerValue || centerLabel) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        {centerValue && (
                            <span className="mono text-[18px] font-bold text-text-1 tracking-[-0.01em]">
                                {centerValue}
                            </span>
                        )}
                        {centerLabel && (
                            <span className="text-[10.5px] font-medium text-text-3">
                                {centerLabel}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {showLegend && (
                <ul
                    className={cn(
                        'flex flex-col gap-2.5',
                        layout === 'row' ? 'flex-1 min-w-0' : 'w-full',
                    )}
                >
                    {data.map((slice) => {
                        const pct = total > 0 ? (slice.value / total) * 100 : 0;
                        return (
                            <li
                                key={slice.name}
                                className="flex items-center justify-between gap-2"
                            >
                                <span className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="w-2.5 h-2.5 rounded-sm flex-none"
                                        style={{ background: slice.color }}
                                    />
                                    <span className="text-[12px] font-medium text-text-2 truncate">
                                        {slice.name}
                                    </span>
                                </span>
                                <span className="flex items-center gap-2.5 flex-none">
                                    <span className="mono text-[12px] font-semibold text-text-1">
                                        {formatValue(slice.value)}
                                    </span>
                                    <span className="mono text-[10.5px] text-text-3 w-11 text-right">
                                        {pct.toFixed(1)}%
                                    </span>
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
