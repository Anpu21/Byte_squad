import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

const variants = {
    primary:
        'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20',
    secondary:
        'bg-white/5 hover:bg-white/10 text-[var(--color-text-primary)] border border-white/10',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20',
    ghost: 'hover:bg-white/5 text-[var(--color-text-secondary)]',
};

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
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
                'rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center gap-2',
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
