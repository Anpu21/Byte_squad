import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PillTone =
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'primary';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
    tone?: PillTone;
    dot?: boolean;
    children: ReactNode;
}

const toneClasses: Record<PillTone, string> = {
    success: 'bg-accent-soft text-accent-text',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
    neutral: 'bg-surface-2 text-text-2',
    primary: 'bg-primary-soft text-primary-soft-text',
};

export default function Pill({
    tone = 'neutral',
    dot = true,
    className,
    children,
    ...props
}: PillProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full text-[11px] font-medium leading-none',
                toneClasses[tone],
                className,
            )}
            {...props}
        >
            {dot && (
                <span
                    className="w-1.5 h-1.5 rounded-full bg-current opacity-80"
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}
