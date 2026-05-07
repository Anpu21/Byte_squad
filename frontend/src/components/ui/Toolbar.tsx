import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ToolbarProps {
    children: ReactNode;
    className?: string;
    right?: ReactNode;
}

export default function Toolbar({ children, right, className }: ToolbarProps) {
    return (
        <div
            className={cn(
                'bg-surface border border-border rounded-md shadow-xs p-3 flex items-center gap-2 mb-3',
                className,
            )}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                {children}
            </div>
            {right && (
                <div className="flex items-center gap-2 flex-shrink-0 text-xs text-text-2">
                    {right}
                </div>
            )}
        </div>
    );
}
