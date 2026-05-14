import {
    type KeyboardEvent,
    type RefObject,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IProduct } from '@/types';

interface TransferRequestCartAddRowProps {
    onSelectProduct: (product: IProduct) => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

const SEARCH_DEBOUNCE_MS = 200;
const RESULT_LIMIT = 6;

export function TransferRequestCartAddRow({
    onSelectProduct,
    inputRef,
}: TransferRequestCartAddRowProps) {
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

    const productsQuery = useQuery({
        queryKey: queryKeys.product.all(),
        queryFn: () => inventoryService.getProducts(),
        select: (list) => list.filter((p) => p.isActive),
    });

    const results = useMemo<IProduct[]>(() => {
        if (!debounced) return [];
        const term = debounced.toLowerCase();
        const all = productsQuery.data ?? [];
        return all
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.barcode.toLowerCase().includes(term),
            )
            .slice(0, RESULT_LIMIT);
    }, [productsQuery.data, debounced]);

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
        trimmed.length > 0 &&
        (results.length > 0 || !productsQuery.isFetching);

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
            commit(results[safeActiveIdx] ?? results[0]);
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setQuery('');
            setDebounced('');
            setIsOpen(false);
        }
    }

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
                    placeholder="Search products to request…"
                    aria-label="Add product to request"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    className="w-full h-8 px-2 bg-canvas border border-border rounded-md text-[12px] text-text-1 outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 transition-all placeholder:text-text-3"
                />

                {showDropdown && (
                    <div
                        role="listbox"
                        aria-label="Product suggestions"
                        className="absolute left-0 right-0 bottom-full mb-1 z-dropdown bg-surface border border-border rounded-md shadow-md-token min-w-[280px] max-h-[260px] overflow-y-auto"
                    >
                        {results.length === 0 ? (
                            <div className="px-3 py-3 text-[12px] text-text-3 text-center">
                                {productsQuery.isFetching
                                    ? 'Searching…'
                                    : `No products found for "${trimmed}"`}
                            </div>
                        ) : (
                            results.map((product, idx) => {
                                const active = idx === safeActiveIdx;
                                return (
                                    <button
                                        type="button"
                                        key={product.id}
                                        role="option"
                                        aria-selected={active}
                                        onMouseEnter={() => setActiveIdx(idx)}
                                        onClick={() => commit(product)}
                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors focus:outline-none ${
                                            active
                                                ? 'bg-primary-soft'
                                                : 'hover:bg-surface-2'
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-text-1 truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-[11px] text-text-3 mono truncate">
                                                {product.barcode ||
                                                    product.id.slice(0, 12)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </td>
            <td className="px-1 py-2" aria-hidden />
            <td className="px-2 py-2" aria-hidden />
        </tr>
    );
}
