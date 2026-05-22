import type { ReactNode } from 'react';

interface FormFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    className?: string;
}

export function FormField({
    label,
    htmlFor,
    error,
    hint,
    children,
    className,
}: FormFieldProps) {
    return (
        <div className={className}>
            <label
                htmlFor={htmlFor}
                className="block text-xs font-medium text-text-2 mb-1.5"
            >
                {label}
            </label>
            {children}
            {hint && !error && (
                <p className="text-[11px] text-text-3 mt-1">{hint}</p>
            )}
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
}
