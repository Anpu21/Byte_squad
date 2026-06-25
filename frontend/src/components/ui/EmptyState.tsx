import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center py-10 px-6',
                className,
            )}
        >
            {icon && (
                <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border text-text-3 inline-flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <div className="text-[17px] font-semibold text-text-1">{title}</div>
            {description && (
                <div className="text-sm text-text-2 mt-1.5 max-w-sm">
                    {description}
                </div>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
