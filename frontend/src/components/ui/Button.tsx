import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}

const variants = {
    // The signature bright white button for main calls-to-action
    primary:
        'bg-white text-slate-900 font-bold hover:shadow-[0_8px_24px_rgba(255,255,255,0.15)] hover:-translate-y-0.5 focus:border-white focus:ring-[3px] focus:ring-white/30',
    
    // Transparent with a subtle border for secondary actions
    secondary:
        'bg-transparent border border-white/10 text-white hover:bg-white/5 focus:ring-[3px] focus:ring-white/20',
    
    // Kept a hint of color for destructive actions, but muted it to fit the high-end dark theme
    danger: 
        'bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 focus:ring-[3px] focus:ring-rose-500/20',
    
    // Invisible until hovered, perfect for icon buttons or subtle text links
    ghost: 
        'text-slate-400 hover:text-white hover:bg-white/5 focus:ring-[3px] focus:ring-white/20',
};

const sizes = {
    // Exact heights ensure pixel-perfect alignment when placed next to inputs
    sm: 'h-8 px-3 text-[11px] uppercase tracking-wider rounded-lg',
    md: 'h-10 px-5 text-sm rounded-xl',
    lg: 'h-12 px-6 text-[15px] rounded-xl',
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
                // Base styles applied to all buttons
                'inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none',
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