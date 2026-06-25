import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Spark from './Spark';

type KpiAccent = 'primary' | 'accent' | 'info' | 'warning' | 'danger';

const accentBar: Record<KpiAccent, string> = {
    primary: 'border-t-2 border-t-primary',
    accent: 'border-t-2 border-t-accent',
    info: 'border-t-2 border-t-info',
    warning: 'border-t-2 border-t-warning',
    danger: 'border-t-2 border-t-danger',
};

const accentIcon: Record<KpiAccent, string> = {
    primary: 'text-primary',
    accent: 'text-accent',
    info: 'text-info',
    warning: 'text-warning',
    danger: 'text-danger',
};

interface KpiCardProps {
    label: string;
    value: ReactNode;
    delta?: ReactNode;
    deltaPositive?: boolean;
    sparkData?: number[];
    sparkColor?: string;
    icon?: ReactNode;
    /** Per-metric accent: colored top-border + icon tint (e.g. revenue→primary). */
    accent?: KpiAccent;
    className?: string;
}

export default function KpiCard({
    label,
    value,
    delta,
    deltaPositive = true,
    sparkData,
    sparkColor,
    icon,
    accent,
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                'flex-1 bg-surface border border-border rounded-md shadow-xs p-5',
                accent && accentBar[accent],
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-3">
                    {label}
                </div>
                {icon && (
                    <div className={accent ? accentIcon[accent] : 'text-text-3'}>
                        {icon}
                    </div>
                )}
            </div>
            <div className="flex items-baseline justify-between mt-1.5 gap-2">
                <div className="num text-[26px] font-bold tracking-[-0.02em] text-text-1">
                    {value}
                </div>
                {delta && (
                    <div
                        className={cn(
                            'text-xs font-semibold',
                            deltaPositive ? 'text-accent-text' : 'text-danger',
                        )}
                    >
                        {delta}
                    </div>
                )}
            </div>
            {sparkData && (
                <div className="mt-2">
                    <Spark
                        data={sparkData}
                        color={sparkColor || 'var(--primary)'}
                        fill
                    />
                </div>
            )}
        </div>
    );
}
