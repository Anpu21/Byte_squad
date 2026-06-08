import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type RefObject,
} from 'react';
import { Plus, X } from 'lucide-react';
import type { ISearchProductRow } from '@/types';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';
import { usePosProductSearch } from '@/features/pos/hooks/usePosProductSearch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import { PosItemSearchResults } from '@/features/pos/components/item-table/PosItemSearchResults';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosBillingEntryRowProps {
    addItem: UsePosCartReturn['addItem'];
    /** Item field ref — wired to F2 / post-checkout refocus from the page. */
    itemInputRef?: RefObject<HTMLInputElement | null>;
}

const QTY_CELL =
    'w-20 h-9 px-2 text-right text-[13px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-50';
const DISC_CELL = QTY_CELL.replace('w-20', 'w-16');

/**
 * BUSY-style line-entry strip pinned at the bottom of the billing grid. Flow:
 * type an item → ↑/↓ to highlight → Enter selects → focus jumps to Qty → type
 * qty → Enter commits the line via `addItem` and returns focus to the item
 * field for the next line. The suggestion dropdown opens **upward** so it is
 * never clipped by the scrolling rows above.
 */
export function PosBillingEntryRow({
    addItem,
    itemInputRef,
}: IPosBillingEntryRowProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mounted = useRef(false);
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [pending, setPending] = useState<ISearchProductRow | null>(null);
    const [qty, setQty] = useState(1);
    const [disc, setDisc] = useState(0);
    const [highlight, setHighlight] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    const search = usePosProductSearch(debounced);
    const results = search.data ?? [];
    const showDropdown = !pending && query.trim().length > 0;

    function focusCell(col: 'item' | 'qty') {
        containerRef.current
            ?.querySelector<HTMLInputElement>(`[data-col="${col}"]`)
            ?.focus();
    }

    // Picked a product → focus Qty; committed / cancelled → focus Item. Skip
    // the initial mount so this doesn't steal focus on first paint.
    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        focusCell(pending ? 'qty' : 'item');
    }, [pending]);

    function selectProduct(row: ISearchProductRow) {
        setPending(row);
        setQty(1);
        setDisc(0);
        setQuery('');
        setDebounced('');
        setHighlight(0);
    }

    function reset() {
        setPending(null);
        setQty(1);
        setDisc(0);
        setQuery('');
        setDebounced('');
    }

    function commit() {
        if (!pending) return;
        addItem({
            ...toCartItemSeed(pending),
            quantity: qty > 0 ? qty : 1,
            discountPercentage: pending.discountAllowed ? disc : 0,
        });
        reset();
    }

    function handleItemKey(e: KeyboardEvent<HTMLInputElement>) {
        if (pending) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const row = results[Math.min(Math.max(highlight, 0), results.length - 1)];
            if (row) selectProduct(row);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setQuery('');
            setDebounced('');
        }
    }

    function handleNumericKey(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            reset();
        }
    }

    return (
        <div
            ref={containerRef}
            className="shrink-0 border-t border-border-strong bg-surface-2/40 px-4 py-2.5"
        >
            <div className="flex items-end gap-2">
                <div className="relative flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-text-3 mb-1">
                        New line — item · Enter · qty · Enter
                    </span>
                    <div className="flex items-center gap-2">
                        <input
                            ref={itemInputRef}
                            data-row-id="entry"
                            data-col="item"
                            type="text"
                            autoComplete="off"
                            value={pending ? pending.productName : query}
                            readOnly={pending !== null}
                            placeholder="Search product by name or code…"
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setHighlight(0);
                            }}
                            onKeyDown={handleItemKey}
                            aria-label="Add item"
                            className="flex-1 h-9 px-3 text-[13px] text-text-1 bg-surface border border-border-strong rounded-md outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 read-only:font-medium"
                        />
                        {pending && (
                            <button
                                type="button"
                                onClick={reset}
                                aria-label="Clear selected product"
                                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-md text-text-3 hover:text-danger hover:bg-danger-soft transition-colors"
                            >
                                <X size={16} aria-hidden />
                            </button>
                        )}
                    </div>
                    {showDropdown && (
                        <div className="absolute left-0 right-0 bottom-full mb-1 z-dropdown">
                            <PosItemSearchResults
                                results={results}
                                onSelect={selectProduct}
                                isLoading={search.isFetching}
                                query={debounced || query.trim()}
                                highlightIndex={highlight}
                            />
                        </div>
                    )}
                </div>

                <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-text-3 mb-1">
                        Qty
                    </span>
                    <PosCartNumericCell
                        value={qty}
                        onCommit={setQty}
                        min={0}
                        ariaLabel="New line quantity"
                        disabled={!pending}
                        selectOnFocus
                        dataRowId="entry"
                        dataCol="qty"
                        onKeyDown={handleNumericKey}
                        className={QTY_CELL}
                    />
                </div>

                <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-text-3 mb-1">
                        Disc %
                    </span>
                    <PosCartNumericCell
                        value={disc}
                        onCommit={setDisc}
                        min={0}
                        max={100}
                        ariaLabel="New line discount percentage"
                        disabled={!pending || !pending.discountAllowed}
                        selectOnFocus
                        dataRowId="entry"
                        dataCol="disc"
                        onKeyDown={handleNumericKey}
                        className={DISC_CELL}
                    />
                </div>

                <button
                    type="button"
                    onClick={commit}
                    disabled={!pending}
                    className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-text-inv text-[13px] font-medium hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus size={16} aria-hidden /> Add
                </button>
            </div>
        </div>
    );
}
