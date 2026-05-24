import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, UserRound, UserX } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { usePosCustomerSearch } from '@/features/pos/hooks/usePosCustomerSearch';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerSearchRow } from '@/types';

interface IPosCustomerPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Fires with the picked customer row, or `null` when the cashier
     * explicitly chooses "Walk-in (no customer)". The parent is responsible
     * for closing the modal — typically by re-toggling `isOpen`.
     */
    onSelect: (customer: ICustomerSearchRow | null) => void;
    /**
     * Debounce window for the search query in ms. Defaults to 300; tests
     * pass a smaller value when they don't want to push fake timers.
     */
    debounceMs?: number;
}

/**
 * Cashier-side customer picker. Renders a search input that debounces into
 * `usePosCustomerSearch`, plus a "Walk-in (no customer)" row pinned at the
 * top so the cashier can always detach the current customer without
 * leaving the modal. Each result row shows the customer name, contact,
 * and the running ledger balance.
 */
export function PosCustomerPickerModal({
    isOpen,
    onClose,
    onSelect,
    debounceMs = 300,
}: IPosCustomerPickerModalProps) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Drain the buffer to the debounced state so the hook only fires for
    // the settled string. Pure setTimeout — no scroll handlers.
    useEffect(() => {
        const handle = setTimeout(
            () => setDebouncedQuery(query.trim()),
            debounceMs,
        );
        return () => clearTimeout(handle);
    }, [query, debounceMs]);

    // Reset state when the modal transitions from open to closed so the
    // next mount starts clean. We anchor `isOpen` and adjust during render
    // rather than via an effect to avoid the cascading-render lint and
    // skip the extra render cycle a useEffect reset would introduce.
    const [wasOpen, setWasOpen] = useState(isOpen);
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (!isOpen) {
            setQuery('');
            setDebouncedQuery('');
        }
    }

    const { data, isLoading, isError } = usePosCustomerSearch(
        debouncedQuery,
        10,
    );

    const rows = useMemo<ICustomerSearchRow[]>(() => data ?? [], [data]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Attach customer"
            maxWidth="md"
        >
            <div className="flex flex-col gap-3">
                <Input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or phone"
                    aria-label="Search customers"
                    leftIcon={<Search size={14} aria-hidden />}
                />

                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-md border border-dashed border-border-strong text-text-2 hover:border-primary hover:bg-primary-soft/40 hover:text-text-1 focus:outline-none focus:ring-[2px] focus:ring-primary/30 transition-colors"
                >
                    <UserX size={16} aria-hidden className="shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-medium">
                            Walk-in (no customer)
                        </span>
                        <span className="text-[11px] text-text-3">
                            Detach the current customer
                        </span>
                    </div>
                </button>

                <div className="flex flex-col">
                    {debouncedQuery.length === 0 ? (
                        <p className="text-[12px] text-text-3 px-1 py-2">
                            Start typing to find a customer.
                        </p>
                    ) : isLoading ? (
                        <p className="text-[12px] text-text-3 px-1 py-2">
                            Searching customers…
                        </p>
                    ) : isError ? (
                        <p className="text-[12px] text-danger px-1 py-2">
                            Customer search failed. Try again in a moment.
                        </p>
                    ) : rows.length === 0 ? (
                        <p className="text-[12px] text-text-3 px-1 py-2">
                            No customers matched “{debouncedQuery}”.
                        </p>
                    ) : (
                        <ul
                            role="listbox"
                            aria-label="Matching customers"
                            className="flex flex-col gap-1 max-h-[360px] overflow-y-auto"
                        >
                            {rows.map((row) => {
                                const owes = row.currentBalance > 0;
                                const credit = row.currentBalance < 0;
                                const balanceTone = owes
                                    ? 'text-danger'
                                    : credit
                                      ? 'text-info'
                                      : 'text-text-2';
                                return (
                                    <li key={row.userId} className="contents">
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={false}
                                            onClick={() => onSelect(row)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover:bg-surface-2 focus:outline-none focus:ring-[2px] focus:ring-primary/30 transition-colors"
                                        >
                                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-soft text-primary-soft-text shrink-0">
                                                <UserRound
                                                    size={14}
                                                    aria-hidden
                                                />
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-[13px] font-medium text-text-1 truncate">
                                                    {`${row.firstName} ${row.lastName}`.trim()}
                                                </span>
                                                <span className="block text-[11px] text-text-3 truncate">
                                                    {row.email}
                                                    {row.phone
                                                        ? ` • ${row.phone}`
                                                        : ''}
                                                </span>
                                            </span>
                                            <span
                                                className={`text-[12px] font-semibold tabular-nums shrink-0 ${balanceTone}`}
                                            >
                                                {formatCurrency(
                                                    Math.abs(row.currentBalance),
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    );
}
