import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
    eyebrow?: ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    subtitle,
    actions,
    eyebrow,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex items-start justify-between gap-4 mb-5',
                className,
            )}
        >
            <div className="min-w-0">
                {eyebrow && (
                    <div className="text-xs text-text-2 mb-1">{eyebrow}</div>
                )}
                <h1 className="text-2xl font-bold text-text-1 tracking-[-0.015em]">
                    {title}
                </h1>
                {subtitle && (
                    <div className="text-xs text-text-2 mt-1">{subtitle}</div>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-2 flex-shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
