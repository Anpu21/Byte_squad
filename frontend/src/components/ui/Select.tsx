import { LuChevronDown as ChevronDown } from 'react-icons/lu';
import { cn } from '@/lib/utils';

export interface SelectOption {
    label: string;
    value: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    id?: string;
    className?: string;
    disabled?: boolean;
    'aria-label'?: string;
}

/**
 * Lightweight, accessible dropdown built on a native `<select>` (keyboard +
 * screen-reader friendly) styled with the design tokens. Used for the shop
 * branch switcher and the category/sort filters.
 */
export function Select({
    value,
    onChange,
    options,
    id,
    className,
    disabled,
    'aria-label': ariaLabel,
}: SelectProps) {
    return (
        <div className={cn('relative inline-flex', className)}>
            <select
                id={id}
                aria-label={ariaLabel}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value)}
                className="h-11 w-full appearance-none rounded-md border border-border-strong bg-surface pl-3 pr-8 text-sm font-medium text-text-1 transition-colors hover:border-text-3 focus:outline-none focus:border-focus focus:ring-[3px] focus:ring-focus/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <ChevronDown
                size={14}
                aria-hidden="true"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-3"
            />
        </div>
    );
}
