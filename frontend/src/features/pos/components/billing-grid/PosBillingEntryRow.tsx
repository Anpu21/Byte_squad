import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type RefObject,
} from 'react';
import { X } from 'lucide-react';
import type { ISearchProductRow } from '@/types';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';
import { usePosItemSearch } from '@/features/pos/hooks/usePosItemSearch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import { formatCurrency } from '@/lib/utils';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';
import { PosItemSearchDropdown } from './PosItemSearchDropdown';

interface IPosBillingEntryRowProps {
    serial: number;
    addItem: UsePosCartReturn['addItem'];
    /** Item field ref — wired to F2 / post-checkout refocus from the page. */
    itemInputRef?: RefObject<HTMLInputElement | null>;
}

const CELL =
    'border-r border-b border-border bg-primary-soft/25 px-2 py-1 align-middle';
const NUM_INPUT =
    'w-full h-7 px-2 text-right text-[12px] text-primary font-medium bg-surface border border-border-strong rounded outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-50';

/**
 * BUSY-style active entry row — the line right after the last committed item.
 * The product search lives in the **Item** column; picking a product fills the
 * row (Unit/Price) with editable Qty + Disc. Flow: type → ↑/↓ → Enter selects →
 * focus jumps to Qty → Enter commits via `addItem` and returns to the item
 * field. Suggestions render through the portalled `PosItemSearchDropdown`.
 */
export function PosBillingEntryRow({
    serial,
    addItem,
    itemInputRef,
}: IPosBillingEntryRowProps) {
    const rowRef = useRef<HTMLTableRowElement>(null);
    const mounted = useRef(false);
    const [pending, setPending] = useState<ISearchProductRow | null>(null);
    const [qty, setQty] = useState(1);
    const [disc, setDisc] = useState(0);

    const search = usePosItemSearch((row) => {
        setPending(row);
        setQty(1);
        setDisc(0);
    });

    const showDropdown = !pending && search.query.trim().length > 0;

    function focusCell(col: 'item' | 'qty') {
        rowRef.current
            ?.querySelector<HTMLInputElement>(`[data-col="${col}"]`)
            ?.focus();
    }

    useEffect(() => {
        if (!mounted.current) {
            mounted.current = true;
            return;
        }
        focusCell(pending ? 'qty' : 'item');
    }, [pending]);

    function reset() {
        setPending(null);
        setQty(1);
        setDisc(0);
        search.clear();
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
            <tr ref={rowRef}>
                <td className={`${CELL} text-right text-[12px] font-semibold tabular-nums text-primary`}>
                    {serial}
                </td>
                <td className={`${CELL} text-left`}>
                    <div className="flex items-center gap-1">
                        <input
                            ref={itemInputRef}
                            data-row-id="entry"
                            data-col="item"
                            type="text"
                            autoComplete="off"
                            value={pending ? pending.productName : search.query}
                            readOnly={pending !== null}
                            placeholder="Type item name or code…"
                            onChange={(e) => search.onQueryChange(e.target.value)}
                            onKeyDown={
                                pending ? undefined : search.handleInputKeyDown
                            }
                            aria-label="Add item"
                            className="w-full h-7 px-2 text-[13px] text-primary font-medium bg-surface border border-primary/60 rounded outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30 read-only:border-border-strong"
                        />
                        {pending && (
                            <button
                                type="button"
                                onClick={reset}
                                aria-label="Clear selected product"
                                className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded text-text-3 hover:text-danger hover:bg-danger-soft transition-colors"
                            >
                                <X size={13} aria-hidden />
                            </button>
                        )}
                    </div>
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
                <td className={`${CELL} text-left text-[12px] uppercase text-primary`}>
                    {pending ? pending.baseUnit : '—'}
                </td>
                <td className={`${CELL} text-right text-[12px] text-primary tabular-nums`}>
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
                <td className={`${CELL} text-right text-[13px] font-semibold tabular-nums ${pending ? 'text-primary' : 'text-text-3'}`}>
                    {previewAmount != null ? formatCurrency(previewAmount) : '—'}
                </td>
            </tr>
            <PosItemSearchDropdown
                open={showDropdown}
                inputRef={itemInputRef}
                results={search.results}
                isFetching={search.isFetching}
                query={search.debounced || search.query.trim()}
                highlight={search.highlight}
                onSelect={search.selectRow}
            />
        </>
    );
}
