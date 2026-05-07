import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id, ...props }, ref) => {
        const uniqueId = useId();
        const inputId = id || uniqueId;

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

                <div className="relative">
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        className={cn(
                            'w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors duration-150 placeholder:text-text-3 disabled:opacity-50 disabled:cursor-not-allowed',
                            error
                                ? 'border-danger focus:border-danger focus:ring-[3px] focus:ring-danger/20'
                                : 'border-border-strong focus:border-primary focus:ring-[3px] focus:ring-primary/20 hover:border-text-3',
                            className,
                        )}
                        {...props}
                    />
                </div>

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
