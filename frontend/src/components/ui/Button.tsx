import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

const variants = {
    primary:
        'bg-primary text-text-inv hover:bg-primary-hover focus:ring-[3px] focus:ring-primary/30',
    secondary:
        'bg-surface text-text-1 border border-border-strong hover:bg-surface-2 focus:ring-[3px] focus:ring-primary/20',
    danger:
        'bg-danger text-white hover:opacity-90 focus:ring-[3px] focus:ring-danger/30',
    ghost:
        'bg-transparent text-text-1 hover:bg-surface-2 focus:ring-[3px] focus:ring-primary/15',
};

const sizes = {
    sm: 'h-[30px] px-2.5 text-xs rounded-md',
    md: 'h-9 px-3.5 text-[13px] rounded-md',
    lg: 'h-11 px-4.5 text-sm rounded-md',
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
                'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap transition-all duration-150 outline-none active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
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
