import { useId } from 'react';
import { LuChevronDown as ChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from './field-styles';

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    id?: string;
    /** Optional persistent (always-floated) label sitting on the top border. */
    label?: string;
    className?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

/**
 * Lightweight, accessible dropdown built on a native `<select>` (keyboard +
 * screen-reader friendly), styled with the shared sharp-field language so it
 * matches `Input` / `Textarea`. A native select always has a value, so its
 * optional `label` is rendered as a persistent label on the top border rather
 * than a floating one.
 */
export function Select({
    value,
    onChange,
    options,
    id,
    label,
    className,
    disabled,
    'aria-label': ariaLabel,
}: SelectProps) {
    const uniqueId = useId();
    const selectId = id || uniqueId;

    return (
        <div className={cn('relative inline-flex', className)}>
            <select
                id={selectId}
                aria-label={ariaLabel}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    FIELD_SHELL,
                    FIELD_BORDER,
                    'h-11 appearance-none pl-3 pr-9 font-medium',
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {label && (
                <label
                    htmlFor={selectId}
                    className="pointer-events-none absolute left-2.5 top-0 z-[1] -translate-y-1/2 bg-surface px-1 text-[11px] font-medium text-text-3"
                >
                    {label}
                </label>
            )}

            <ChevronDown
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-3"
            />
        </div>
    );
}
