import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

// Ledger UI Kit — direction A. Solid primary, bordered secondary, quiet ghost,
// purple outline (uses --focus), solid danger. Weight 600, radius-sm (9px).
const variants = {
    primary:
        'border border-primary bg-primary text-text-inv hover:bg-primary-hover hover:border-primary-hover focus-visible:ring-[3px] focus-visible:ring-primary/30',
    secondary:
        'border border-border-strong bg-surface text-text-1 hover:bg-surface-hover hover:border-text-3 focus-visible:ring-[3px] focus-visible:ring-focus/25',
    danger:
        'border border-danger bg-danger text-white opacity-95 hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-danger/30',
    ghost:
        'border border-transparent bg-transparent text-text-2 hover:bg-surface-2 hover:text-text-1 focus-visible:ring-[3px] focus-visible:ring-focus/25',
    outline:
        'border border-focus bg-transparent text-focus hover:bg-focus-soft focus-visible:ring-[3px] focus-visible:ring-focus/25',
};

const sizes = {
    sm: 'h-8 px-3.5 text-[13px] rounded-md',
    md: 'h-10 px-[18px] text-sm rounded-md',
    lg: 'h-12 px-6 text-[15px] rounded-md',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-all duration-150 outline-none active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
