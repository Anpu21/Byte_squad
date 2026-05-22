import {
    type KeyboardEvent,
    type RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Camera, Plus } from 'lucide-react';
import { useInventoryByBranchQuery } from '@/hooks/useInventoryByBranchQuery';
import type { IProduct } from '@/types';

interface AdminTransferCartAddRowProps {
    sourceBranchId: string;
    onSelectProduct: (product: IProduct) => void;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

const SEARCH_DEBOUNCE_MS = 200;
const RESULT_LIMIT = 6;

export function AdminTransferCartAddRow({
    sourceBranchId,
    onSelectProduct,
    onOpenCamera,
    inputRef,
}: AdminTransferCartAddRowProps) {
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const cellRef = useRef<HTMLTableCellElement>(null);

    const trimmed = query.trim();
    if (!trimmed && debounced !== '') setDebounced('');

    useEffect(() => {
        if (!trimmed) return;
        const timer = setTimeout(
            () => setDebounced(trimmed),
            SEARCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(timer);
    }, [trimmed]);

    const inventoryQuery = useInventoryByBranchQuery(
        sourceBranchId || undefined,
        { search: debounced || undefined, limit: RESULT_LIMIT },
        {
            enabled:
                Boolean(sourceBranchId) && debounced.length > 0,
        },
    );

    const results = useMemo<{ product: IProduct; quantity: number }[]>(
        () =>
            (inventoryQuery.data?.items ?? []).map((row) => ({
                product: row.product,
                quantity: row.quantity,
            })),
        [inventoryQuery.data],
    );

    const safeActiveIdx =
        results.length === 0
            ? 0
            : Math.min(activeIdx, results.length - 1);

    useEffect(() => {
        if (!isOpen) return;
        function onDocClick(e: MouseEvent) {
            if (!cellRef.current) return;
            if (!cellRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [isOpen]);

    const showDropdown =
        isOpen &&
        Boolean(sourceBranchId) &&
        trimmed.length > 0 &&
        (results.length > 0 || !inventoryQuery.isFetching);

    function commit(product: IProduct | undefined) {
        if (!product) return;
        onSelectProduct(product);
        setQuery('');
        setDebounced('');
        setActiveIdx(0);
        setIsOpen(false);
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIsOpen(true);
            if (results.length > 0) {
                setActiveIdx((prev) => (prev + 1) % results.length);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIsOpen(true);
            if (results.length > 0) {
                setActiveIdx(
                    (prev) =>
                        (prev - 1 + results.length) % results.length,
                );
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commit(results[safeActiveIdx]?.product ?? results[0]?.product);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setQuery('');
            setDebounced('');
            setIsOpen(false);
        }
    }

    const placeholder = sourceBranchId
        ? 'Scan or search source-branch products…'
        : 'Pick a source branch first';

    return (
        <tr className="bg-surface-2/30 border-t border-border-strong">
            <td className="px-3 py-2.5 text-center align-middle">
                <Plus
                    size={14}
                    strokeWidth={2}
                    className="text-text-3 inline-block"
                    aria-hidden
                />
            </td>
            <td ref={cellRef} className="relative px-2 py-2 align-middle">
                <div className="flex items-center gap-1">
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                            setActiveIdx(0);
                        }}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={onKeyDown}
                        placeholder={placeholder}
                        aria-label="Add product to transfer"
                        aria-autocomplete="list"
                        aria-expanded={showDropdown}
                        disabled={!sourceBranchId}
                        className="flex-1 min-w-0 h-8 px-2 bg-canvas border border-border rounded-md text-[12px] text-text-1 outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 transition-all placeholder:text-text-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                        type="button"
                        onClick={onOpenCamera}
                        disabled={!sourceBranchId}
                        title="Scan with camera"
                        aria-label="Open camera scanner"
                        className="h-8 w-8 flex-shrink-0 bg-surface border border-border rounded-md flex items-center justify-center text-text-2 hover:text-text-1 hover:border-border-strong hover:bg-surface-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-[2px] focus:ring-primary/20"
                    >
                        <Camera size={14} strokeWidth={1.75} />
                    </button>
                </div>

                {showDropdown && (
                    <div
                        role="listbox"
                        aria-label="Product suggestions"
                        className="absolute left-0 right-0 bottom-full mb-1 z-dropdown bg-surface border border-border rounded-md shadow-md-token min-w-[280px] max-h-[260px] overflow-y-auto"
                    >
                        {results.length === 0 ? (
                            <div className="px-3 py-3 text-[12px] text-text-3 text-center">
                                {inventoryQuery.isFetching
                                    ? 'Searching…'
                                    : `No products found for "${trimmed}"`}
                            </div>
                        ) : (
                            results.map((row, idx) => {
                                const active = idx === safeActiveIdx;
                                return (
                                    <button
                                        type="button"
                                        key={row.product.id}
                                        role="option"
                                        aria-selected={active}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                        onClick={() => commit(row.product)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors focus:outline-none ${
                                            active
                                                ? 'bg-primary-soft'
                                                : 'hover:bg-surface-2'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-text-1 truncate">
                                                {row.product.name}
                                            </p>
                                            <p className="text-[11px] text-text-3 mono truncate">
                                                {row.product.barcode ||
                                                    row.product.id.slice(0, 12)}
                                            </p>
                                        </div>
                                        <span className="text-[11px] text-text-2 mono flex-shrink-0 tabular-nums">
                                            {row.quantity} in stock
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </td>
            <td className="px-2 py-2" aria-hidden />
            <td className="px-1 py-2" aria-hidden />
            <td className="px-2 py-2" aria-hidden />
            <td className="px-4 py-2" aria-hidden />
        </tr>
    );
}
