import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Spark from './Spark';

type KpiAccent = 'primary' | 'accent' | 'info' | 'warning' | 'danger';

// Ledger UI Kit stat card: mono value, a colored 30×30 icon-wrap, delta pill.
const iconWrap: Record<KpiAccent, string> = {
    primary: 'bg-primary-soft text-primary',
    accent: 'bg-accent-soft text-accent-text',
    info: 'bg-info-soft text-info',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
};

const valueColor: Record<KpiAccent, string> = {
    primary: 'text-text-1',
    accent: 'text-accent-text',
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-danger',
};

interface KpiCardProps {
    label: string;
    value: ReactNode;
    delta?: ReactNode;
    deltaPositive?: boolean;
    /** Muted caption shown next to the delta pill (e.g. "vs last week", "13 pending"). */
    note?: ReactNode;
    sparkData?: number[];
    sparkColor?: string;
    /** Override the sparkline height (the dashboard overview uses 38px). */
    sparkHeight?: number;
    icon?: ReactNode;
    /** Per-metric accent: colored icon-wrap + value tint (e.g. revenue→accent). */
    accent?: KpiAccent;
    className?: string;
}

export default function KpiCard({
    label,
    value,
    delta,
    deltaPositive = true,
    note,
    sparkData,
    sparkColor,
    sparkHeight,
    icon,
    accent,
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                'flex-1 bg-surface border border-border rounded-lg shadow-sm-token p-5',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="mono text-[11px] font-semibold tracking-[0.1em] uppercase text-text-3">
                    {label}
                </div>
                {icon && (
                    <div
                        className={cn(
                            'w-[30px] h-[30px] rounded-lg inline-flex items-center justify-center',
                            accent ? iconWrap[accent] : 'bg-surface-2 text-text-3',
                        )}
                    >
                        {icon}
                    </div>
                )}
            </div>
            <div className="flex items-baseline justify-between mt-3.5 gap-2">
                <div
                    className={cn(
                        'mono text-[26px] font-bold tracking-[-0.01em]',
                        accent ? valueColor[accent] : 'text-text-1',
                    )}
                >
                    {value}
                </div>
            </div>
            {(delta || note) && (
                <div className="flex items-center gap-2 mt-2.5">
                    {delta && (
                        <span
                            className={cn(
                                'mono inline-flex items-center h-5 px-[7px] rounded-md text-[11.5px] font-semibold',
                                deltaPositive
                                    ? 'bg-accent-soft text-accent-text'
                                    : 'bg-danger-soft text-danger',
                            )}
                        >
                            {delta}
                        </span>
                    )}
                    {note && (
                        <span className="text-[11.5px] text-text-3 truncate">
                            {note}
                        </span>
                    )}
                </div>
            )}
            {sparkData && (
                <div className="mt-2">
                    <Spark
                        data={sparkData}
                        color={sparkColor || 'var(--primary)'}
                        h={sparkHeight}
                        fill
                    />
                </div>
            )}
        </div>
    );
}
