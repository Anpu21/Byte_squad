import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export default function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden',
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: CardProps) {
    return (
        <div
            className={cn('p-6 border-b border-white/10 bg-white/[0.02]', className)}
            {...props}
        />
    );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('text-base font-semibold text-white tracking-tight', className)}
            {...props}
        />
    );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn('text-xs text-slate-400 mt-1', className)}
            {...props}
        />
    );
}

export function CardContent({ className, ...props }: CardProps) {
    return (
        <div className={cn('p-6', className)} {...props} />
    );
}

export function CardFooter({ className, ...props }: CardProps) {
    return (
        <div
            className={cn('p-5 border-t border-white/10 bg-white/[0.02] flex items-center', className)}
            {...props}
        />
    );
}