import {
    forwardRef,
    useId,
    type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER, FIELD_ERROR, FIELD_SHAKE } from './field-styles';

export interface TextareaProps
    extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

/**
 * Multi-line sibling of `Input` with the same floating-label + sharp-field
 * treatment. Labeled textareas float the label onto the top border on
 * focus/fill; unlabeled ones keep their own placeholder.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, className, id, placeholder, rows = 4, ...props }, ref) => {
        const uniqueId = useId();
        const inputId = id || uniqueId;
        const floating = !!label;
        const errorId = error ? `${inputId}-error` : undefined;

        return (
            <div className="w-full">
                <div className={cn('relative', error && FIELD_SHAKE)}>
                    <textarea
                        ref={ref}
                        id={inputId}
                        rows={rows}
                        aria-invalid={!!error}
                        aria-describedby={errorId}
                        className={cn(
                            'peer min-h-[88px] resize-y px-3 py-2.5 leading-relaxed',
                            FIELD_SHELL,
                            error ? FIELD_ERROR : FIELD_BORDER,
                            className,
                        )}
                        placeholder={floating ? ' ' : placeholder}
                        {...props}
                    />

                    {floating && (
                        <label
                            htmlFor={inputId}
                            className={cn(
                                'pointer-events-none absolute left-2.5 top-3 z-[1] bg-surface px-1 text-[13px] font-normal text-text-3 transition-all duration-150 ease-out',
                                'peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:font-medium',
                                'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium',
                                error
                                    ? 'text-danger peer-focus:text-danger'
                                    : 'peer-focus:text-focus',
                            )}
                        >
                            {label}
                        </label>
                    )}
                </div>

                {error && (
                    <p
                        id={errorId}
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger animate-in fade-in slide-in-from-top-1 duration-200"
                    >
                        <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
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

Textarea.displayName = 'Textarea';
export default Textarea;
