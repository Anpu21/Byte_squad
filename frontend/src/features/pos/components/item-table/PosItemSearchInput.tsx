import { useEffect, useState, type ChangeEvent, type RefObject } from 'react';
import { LuSearch as Search } from 'react-icons/lu';
import Input from '@/components/ui/Input';

interface IPosItemSearchInputProps {
    value: string;
    onChange: (next: string) => void;
    inputRef?: RefObject<HTMLInputElement | null>;
    placeholder?: string;
    /** Set true while the backing search query is in-flight. */
    isSearching?: boolean;
    /** Called with the trimmed value once it has settled for `debounceMs`. */
    onDebouncedChange?: (debounced: string) => void;
    debounceMs?: number;
}

const DEFAULT_DEBOUNCE_MS = 300;

/**
 * Debounced product search box. The visible value updates on every
 * keystroke so the input stays responsive; the debounced value (passed
 * to `onDebouncedChange`) is what should feed the network query.
 *
 * The component is intentionally controlled — the orchestrator owns the
 * raw string so other surfaces (barcode scanner, keyboard shortcut) can
 * push values into the box.
 */
export function PosItemSearchInput({
    value,
    onChange,
    inputRef,
    placeholder = 'Search by code or name',
    isSearching = false,
    onDebouncedChange,
    debounceMs = DEFAULT_DEBOUNCE_MS,
}: IPosItemSearchInputProps) {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const handle = setTimeout(() => setDebounced(value.trim()), debounceMs);
        return () => clearTimeout(handle);
    }, [value, debounceMs]);

    useEffect(() => {
        onDebouncedChange?.(debounced);
    }, [debounced, onDebouncedChange]);

    return (
        <Input
            ref={inputRef}
            value={value}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange(e.target.value)
            }
            leftIcon={<Search size={16} aria-hidden />}
            placeholder={placeholder}
            sizeVariant="lg"
            aria-label="Search products"
            aria-busy={isSearching}
            autoComplete="off"
            spellCheck={false}
        />
    );
}
