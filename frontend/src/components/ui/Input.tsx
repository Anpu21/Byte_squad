import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, id, ...props }, ref) => {
        // Auto-generate a unique ID for accessibility if one isn't provided
        const uniqueId = useId();
        const inputId = id || uniqueId;

        return (
            <div className="w-full">
                {/* Standardized Uppercase Label */}
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-[1px]"
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
                            // Base input styles
                            'w-full h-11 px-4 bg-[#0a0a0a] border rounded-xl text-sm text-slate-200 outline-none transition-all duration-200 placeholder:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed',
                            
                            // Dynamic state styling (Error vs Default)
                            error 
                                ? 'border-rose-500/50 focus:border-rose-500 focus:ring-[3px] focus:ring-rose-500/20' 
                                : 'border-white/10 focus:border-white focus:ring-[3px] focus:ring-white/20 hover:border-white/20',
                            
                            // User overrides
                            className
                        )}
                        {...props}
                    />
                </div>

                {/* Standardized Animated Error Message */}
                {error && (
                    <p className="mt-2 text-[12px] text-rose-400 flex items-center gap-1.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
                        <svg 
                            width="14" 
                            height="14" 
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