import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type CardAccent = 'primary' | 'accent' | 'info' | 'warning' | 'danger';

const cardAccent: Record<CardAccent, string> = {
    primary: 'border-t-2 border-t-primary',
    accent: 'border-t-2 border-t-accent',
    info: 'border-t-2 border-t-info',
    warning: 'border-t-2 border-t-warning',
    danger: 'border-t-2 border-t-danger',
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    tone?: 'default' | 'elevated';
    /** Optional colored top-border for emphasis (per-metric / per-status). */
    accent?: CardAccent;
}

export default function Card({ className, tone = 'default', accent, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface border border-border overflow-hidden',
                tone === 'elevated' ? 'rounded-lg shadow-md-token' : 'rounded-md shadow-xs',
                accent && cardAccent[accent],
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'p-5 border-b border-border flex items-center justify-between gap-3',
                className,
            )}
            {...props}
        />
    );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('text-[15px] font-semibold text-text-1 tracking-tight', className)}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className={cn('text-xs text-text-2 mt-1', className)} {...props} />
    );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'px-5 py-4 border-t border-border bg-surface-2 flex items-center',
                className,
            )}
            {...props}
        />
    );
}
