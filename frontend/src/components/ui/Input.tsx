import {
    forwardRef,
    useId,
    type InputHTMLAttributes,
    type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
    FIELD_SHELL,
    FIELD_BORDER,
    FIELD_ERROR,
    FIELD_HEIGHT,
    FIELD_SHAKE,
} from './field-styles';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: ReactNode;
    rightSlot?: ReactNode;
    /** md = 44px (default), lg = 48px */
    sizeVariant?: 'md' | 'lg';
}

/**
 * Sharp, motion-aware text field.
 *
 * When a `label` is provided it becomes a floating label: it rests inside the
 * field and rises onto the top border (shrinking) once the field is focused or
 * filled. This is CSS-only — driven by `peer` + a `placeholder=" "` sentinel +
 * `:placeholder-shown` — so it works with controlled / react-hook-form inputs
 * and keeps a real `<label htmlFor>` for accessibility.
 *
 * Without a `label` it renders as a plain sharp field with its own placeholder
 * (used for search / icon fields like the POS item search).
 */
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
            placeholder,
            ...props
        },
        ref,
    ) => {
        const uniqueId = useId();
        const inputId = id || uniqueId;
        const floating = !!label;
        const errorId = error ? `${inputId}-error` : undefined;
        // Native date/time fields can't take a text placeholder — the browser
        // shows "mm/dd/yyyy" in full text colour, so an empty field reads as
        // filled. While a *controlled* value is still empty we mute that hint so
        // it reads like a placeholder (see `.date-empty` in index.css). Skipped
        // for uncontrolled/RHF inputs (value undefined) where we can't tell.
        const dateLike =
            props.type === 'date' ||
            props.type === 'datetime-local' ||
            props.type === 'month' ||
            props.type === 'week' ||
            props.type === 'time';
        const isDateEmpty = dateLike && props.value === '';

        return (
            <div className="w-full">
                <div className={cn('relative', error && FIELD_SHAKE)}>
                    {leftIcon && (
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center text-text-3">
                            {leftIcon}
                        </span>
                    )}

                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={errorId}
                        className={cn(
                            'peer w-full',
                            FIELD_SHELL,
                            FIELD_HEIGHT[sizeVariant],
                            leftIcon ? 'pl-9' : 'pl-3',
                            rightSlot ? 'pr-10' : 'pr-3',
                            error ? FIELD_ERROR : FIELD_BORDER,
                            isDateEmpty && 'date-empty',
                            className,
                        )}
                        placeholder={floating ? ' ' : placeholder}
                        {...props}
                    />

                    {floating && (
                        <label
                            htmlFor={inputId}
                            className={cn(
                                'pointer-events-none absolute top-1/2 z-[1] -translate-y-1/2 bg-surface px-1 text-[13px] font-normal text-text-3 transition-all duration-150 ease-out',
                                leftIcon ? 'left-8' : 'left-2.5',
                                // Floated (focused or filled): rise onto the top border, shrink.
                                'peer-focus:top-0 peer-focus:left-2.5 peer-focus:text-[11px] peer-focus:font-medium',
                                'peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:left-2.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-medium',
                                error
                                    ? 'text-danger peer-focus:text-danger'
                                    : 'peer-focus:text-focus',
                            )}
                        >
                            {label}
                        </label>
                    )}

                    {rightSlot && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center">
                            {rightSlot}
                        </span>
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

Input.displayName = 'Input';
export default Input;
