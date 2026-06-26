import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    className?: string;
}

/**
 * Shimmer placeholder for loading states. Uses Tailwind's `animate-pulse`, which
 * the global `prefers-reduced-motion` block in index.css neutralizes automatically.
 */
export default function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn('animate-pulse rounded-md bg-surface-2', className)}
            aria-hidden="true"
            {...props}
        />
    );
}

interface SkeletonTextProps {
    lines?: number;
    className?: string;
}

/** A stack of skeleton lines for placeholder paragraphs/blocks. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')}
                />
            ))}
        </div>
    );
}
