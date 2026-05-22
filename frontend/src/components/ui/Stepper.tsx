import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    size?: 'sm' | 'md';
    className?: string;
    disabled?: boolean;
}

export default function Stepper({
    value,
    onChange,
    min = 0,
    max,
    step = 1,
    size = 'md',
    className,
    disabled,
}: StepperProps) {
    const btnSize = size === 'sm' ? 'h-[26px] w-[26px]' : 'h-[30px] w-[30px]';
    const valBox = size === 'sm' ? 'w-8' : 'w-9';
    const dec = () => {
        if (disabled) return;
        const next = value - step;
        if (next < min) return;
        onChange(next);
    };
    const inc = () => {
        if (disabled) return;
        const next = value + step;
        if (max !== undefined && next > max) return;
        onChange(next);
    };
    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <button
                type="button"
                onClick={dec}
                disabled={disabled || value <= min}
                className={cn(
                    'inline-flex items-center justify-center border border-border rounded-md text-text-1 hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                    btnSize,
                )}
                aria-label="Decrease"
            >
                <Minus size={12} />
            </button>
            <div
                className={cn(
                    'mono text-center font-semibold text-text-1 text-[13px]',
                    valBox,
                )}
            >
                {value}
            </div>
            <button
                type="button"
                onClick={inc}
                disabled={disabled || (max !== undefined && value >= max)}
                className={cn(
                    'inline-flex items-center justify-center border border-border rounded-md text-text-1 hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
                    btnSize,
                )}
                aria-label="Increase"
            >
                <Plus size={12} />
            </button>
        </div>
    );
}
