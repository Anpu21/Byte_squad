import { type ReactNode } from 'react';
import { LuSearch as Search } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import Input from './Input';

interface FilterBarProps {
    /** When provided, renders a leading search field. */
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    /** Filter controls (selects, segmented, etc.). */
    children?: ReactNode;
    /** Right-aligned slot (result count, actions). */
    right?: ReactNode;
    className?: string;
}

/**
 * The shared filter row that sits above a table (typically inside a `Card`,
 * flush with the table's top border). Bakes in the search field so every
 * list screen gets the same search affordance and spacing.
 */
export default function FilterBar({
    search,
    onSearchChange,
    searchPlaceholder = 'Search…',
    children,
    right,
    className,
}: FilterBarProps) {
    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border bg-surface',
                className,
            )}
        >
            {onSearchChange && (
                <div className="w-full sm:w-64">
                    <Input
                        value={search ?? ''}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        leftIcon={<Search size={15} aria-hidden />}
                        aria-label={searchPlaceholder}
                    />
                </div>
            )}
            {children}
            {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </div>
    );
}
