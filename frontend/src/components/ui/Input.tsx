import {
    forwardRef,
    useId,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightSlot?: ReactNode;
    /** md = 38px (default), lg = 42px */
    sizeVariant?: 'md' | 'lg';
}

const HEIGHT: Record<NonNullable<InputProps['sizeVariant']>, string> = {
    md: 'h-[38px]',
    lg: 'h-[42px]',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            leftIcon,
            rightSlot,
            sizeVariant = 'md',
            className,
            id,
            ...props
        },
        ref,
    ) => {
        const uniqueId = useId();
        const inputId = id || uniqueId;
        const hasAdornments = !!leftIcon || !!rightSlot;
        const heightClass = HEIGHT[sizeVariant];

        const borderClass = error
            ? 'border-danger'
            : 'border-border-strong hover:border-text-3';
        const focusClass = error
            ? 'focus-within:border-danger focus-within:ring-[3px] focus-within:ring-danger/30'
            : 'focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/30';

        const wrapperClass = cn(
            'flex items-center gap-2 px-3 bg-surface border rounded-md transition-colors',
            heightClass,
            borderClass,
            focusClass,
        );

        const standaloneInputClass = cn(
            'w-full px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors duration-150 placeholder:text-text-3 disabled:opacity-50 disabled:cursor-not-allowed',
            heightClass,
            error
                ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/30'
                : 'border-border-strong hover:border-text-3 focus:border-primary focus:ring-[3px] focus:ring-primary/30',
        );

        const innerInputClass =
            'flex-1 bg-transparent outline-none text-[13px] text-text-1 placeholder:text-text-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-0';

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-xs font-medium text-text-2 mb-1.5"
                    >
                        {label}
                    </label>
                )}

                {hasAdornments ? (
                    <div className={wrapperClass}>
                        {leftIcon && (
                            <span className="text-text-3 flex-shrink-0 inline-flex items-center">
                                {leftIcon}
                            </span>
                        )}
                        <input
                            ref={ref}
                            id={inputId}
                            aria-invalid={!!error}
                            className={cn(innerInputClass, className)}
                            {...props}
                        />
                        {rightSlot && (
                            <span className="flex-shrink-0 inline-flex items-center">
                                {rightSlot}
                            </span>
                        )}
                    </div>
                ) : (
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        className={cn(standaloneInputClass, className)}
                        {...props}
                    />
                )}

                {error && (
                    <p className="mt-1.5 text-xs text-danger flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    },
);

Input.displayName = 'Input';
export default Input;
