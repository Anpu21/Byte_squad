import type { ReactNode } from 'react';

interface EmployeeFormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: ReactNode;
    className?: string;
}

/**
 * Tiny presentational wrapper for an employee-form label / control
 * stack. Kept local to the feature so the product-form `FormField`
 * doesn't gain HR-only knobs.
 */
export function EmployeeFormField({
    label,
    htmlFor,
    error,
    hint,
    required,
    children,
    className,
}: EmployeeFormFieldProps) {
    return (
        <div className={className}>
            <label
                htmlFor={htmlFor}
                className="block text-xs font-medium text-text-2 mb-1.5"
            >
                {label}
                {required && (
                    <span className="text-danger ml-0.5" aria-hidden>
                        *
                    </span>
                )}
            </label>
            {children}
            {hint && !error && (
                <p className="text-[11px] text-text-3 mt-1">{hint}</p>
            )}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
