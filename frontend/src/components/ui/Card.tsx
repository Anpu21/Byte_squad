import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
    tone?: 'default' | 'elevated';
}

export default function Card({ className, tone = 'default', ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface border border-border overflow-hidden',
                tone === 'elevated' ? 'rounded-lg shadow-md-token' : 'rounded-md shadow-xs',
                className,
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: CardProps) {
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

export function CardContent({ className, ...props }: CardProps) {
    return <div className={cn('p-5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
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
