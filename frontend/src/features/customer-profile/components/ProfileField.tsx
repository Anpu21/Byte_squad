import type { ReactNode } from 'react';

interface ProfileFieldProps {
    label: string;
    hint?: string;
    children: ReactNode;
}

export function ProfileField({ label, hint, children }: ProfileFieldProps) {
    return (
        <label className="block">
            <span className="block text-[11px] font-semibold text-text-2 uppercase tracking-[1px] mb-1.5">
                {label}
            </span>
            {children}
            {hint && (
                <span className="block text-[10.5px] text-text-3 mt-1">
                    {hint}
                </span>
            )}
        </label>
    );
}
