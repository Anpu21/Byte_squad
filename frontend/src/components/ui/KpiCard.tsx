import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Spark from './Spark';

interface KpiCardProps {
    label: string;
    value: ReactNode;
    delta?: ReactNode;
    deltaPositive?: boolean;
    sparkData?: number[];
    sparkColor?: string;
    icon?: ReactNode;
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
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                'flex-1 bg-surface border border-border rounded-md shadow-xs p-5',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-text-3">
                    {label}
                </div>
                {icon && <div className="text-text-3">{icon}</div>}
            </div>
            <div className="flex items-baseline justify-between mt-1.5 gap-2">
                <div className="num text-[26px] font-semibold tracking-[-0.02em] text-text-1">
                    {value}
                </div>
                {delta && (
                    <div
                        className={cn(
                            'text-xs font-medium',
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
