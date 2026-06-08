import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import type { ISearchProductRow } from '@/types';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';
import { usePosProductSearch } from '@/features/pos/hooks/usePosProductSearch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import { formatCurrency } from '@/lib/utils';
import { PosItemSearchResults } from '@/features/pos/components/item-table/PosItemSearchResults';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosBillingEntryRowProps {
    addItem: UsePosCartReturn['addItem'];
    /** Item field ref — wired to F2 / post-checkout refocus from the page. */
    itemInputRef?: RefObject<HTMLInputElement | null>;
}

const CELL =
    'sticky bottom-0 z-10 border-r border-b border-border bg-surface-2 px-2 py-1.5 align-middle';
const NUM_INPUT =
    'w-full h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-50';
const MUTED = 'text-right text-[12px] text-text-3 tabular-nums';

/**
 * BUSY/Tally-style inline entry — the pinned bottom row of the billing grid.
 * The product search lives in the **Product Name** column; the rest of the row
 * mirrors a committed line (the picked product's code/MRP/unit/price fill in,
 * with editable Qty/Disc and an Add button). Flow: type → ↑/↓ → Enter selects →
 * focus jumps to Qty → Enter commits via `addItem` and returns to the item
 * field. The suggestion dropdown is **portalled** to `document.body` and
 * anchored to the input so the grid's scroll/overflow never clips it.
 */
export function PosBillingEntryRow({
    addItem,
    itemInputRef,
}: IPosBillingEntryRowProps) {
    const rowRef = useRef<HTMLTableRowElement>(null);
    const mounted = useRef(false);
    const [query, setQuery] = useState('');
    const [debounced, setDebounced] = useState('');
    const [pending, setPending] = useState<ISearchProductRow | null>(null);
    const [qty, setQty] = useState(1);
    const [disc, setDisc] = useState(0);
    const [highlight, setHighlight] = useState(0);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    const search = usePosProductSearch(debounced);
    const results = search.data ?? [];
    const showDropdown = !pending && query.trim().length > 0;

    // Anchor the portalled dropdown to the live input rect so it escapes the
    // grid's overflow without being clipped, and tracks scroll/resize.
    useLayoutEffect(() => {
        if (!showDropdown) return;
        const update = () => {
            if (itemInputRef?.current) {
                setAnchorRect(itemInputRef.current.getBoundingClientRect());
            }
        };
        update();
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [showDropdown, itemInputRef]);

    function focusCell(col: 'item' | 'qty') {
        rowRef.current
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
            const row =
                results[Math.min(Math.max(highlight, 0), results.length - 1)];
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

    const previewAmount = pending
        ? (qty > 0 ? qty : 1) *
          pending.retailPrice *
          (1 - (pending.discountAllowed ? disc : 0) / 100)
        : null;

    return (
        <>
            <tr ref={rowRef} className="bg-surface-2">
                <td className={`${CELL} text-center text-[12px] font-semibold text-primary`}>
                    ›
                </td>
                <td className={`${CELL} font-mono text-[12px] text-text-3 truncate`}>
                    {pending?.productCode ?? ''}
                </td>
                <td className={`${CELL} text-left`}>
                    <div className="flex items-center gap-1">
                        <input
                            ref={itemInputRef}
                            data-row-id="entry"
                            data-col="item"
                            type="text"
                            autoComplete="off"
                            value={pending ? pending.productName : query}
                            readOnly={pending !== null}
                            placeholder="Type product name or code…"
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setHighlight(0);
                            }}
                            onKeyDown={handleItemKey}
                            aria-label="Add item"
                            className="w-full h-8 px-2 text-[13px] text-text-1 bg-surface border border-primary/60 rounded-md outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 read-only:font-medium read-only:border-border-strong"
                        />
                        {pending && (
                            <button
                                type="button"
                                onClick={reset}
                                aria-label="Clear selected product"
                                className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-text-3 hover:text-danger hover:bg-danger-soft transition-colors"
                            >
                                <X size={14} aria-hidden />
                            </button>
                        )}
                    </div>
                </td>
                <td className={`${CELL} ${MUTED}`}>
                    {pending?.mrp != null ? formatCurrency(pending.mrp) : '—'}
                </td>
                <td className={`${CELL} text-left text-[12px] uppercase text-text-2`}>
                    {pending ? pending.baseUnit : '—'}
                </td>
                <td className={`${CELL} ${MUTED}`}>
                    {pending ? formatCurrency(pending.retailPrice) : '—'}
                </td>
                <td className={CELL}>
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
                        className={NUM_INPUT}
                    />
                </td>
                <td className={`${CELL} ${MUTED}`}>
                    {pending ? String(pending.taxRate) : '—'}
                </td>
                <td className={CELL}>
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
                        className={NUM_INPUT}
                    />
                </td>
                <td className={`${CELL} ${MUTED}`}>—</td>
                <td className={`${CELL} text-right text-[13px] font-semibold text-text-1 tabular-nums`}>
                    {previewAmount != null ? formatCurrency(previewAmount) : '—'}
                </td>
                <td className={`${CELL} text-center`}>
                    <button
                        type="button"
                        onClick={commit}
                        disabled={!pending}
                        aria-label="Add line"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary text-text-inv hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={15} aria-hidden />
                    </button>
                </td>
            </tr>
            {showDropdown &&
                anchorRect &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            left: anchorRect.left,
                            bottom: window.innerHeight - anchorRect.top + 4,
                            width: Math.max(anchorRect.width, 260),
                        }}
                        className="z-modal"
                    >
                        <PosItemSearchResults
                            results={results}
                            onSelect={selectProduct}
                            isLoading={search.isFetching}
                            query={debounced || query.trim()}
                            highlightIndex={highlight}
                        />
                    </div>,
                    document.body,
                )}
        </>
    );
}
