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
                <div className="w-14 h-14 rounded-full bg-surface-2 text-text-3 inline-flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <div className="text-[15px] font-semibold text-text-1">{title}</div>
            {description && (
                <div className="text-xs text-text-2 mt-1 max-w-sm">
                    {description}
                </div>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
