import { useRef, type RefObject } from 'react';
import type { ISearchProductRow } from '@/types';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';
import { usePosItemSearch } from '@/features/pos/hooks/usePosItemSearch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import { PosItemSearchDropdown } from './PosItemSearchDropdown';

interface IPosBillingEntryRowProps {
    serial: number;
    addItem: UsePosCartReturn['addItem'];
    /** Item field ref — wired to F2 / post-checkout refocus from the page. */
    itemInputRef?: RefObject<HTMLInputElement | null>;
}

const CELL =
    'border-r border-b border-border bg-primary-soft/25 px-2 py-1 align-middle';
const PLACEHOLDER = `${CELL} text-[12px] text-text-3 tabular-nums`;

/**
 * BUSY-style active entry row — the line right after the last committed item.
 * Flow: type in the **Item** field → ↑/↓ → Enter (or click) picks a product,
 * which is **added to the cart immediately at quantity 1**. The row then
 * clears and re-focuses the Item field so the cashier can type the next item
 * with no extra keystrokes. Quantity and discount are adjusted afterwards on
 * the committed row. Suggestions render through the portalled
 * `PosItemSearchDropdown`.
 */
export function PosBillingEntryRow({
    serial,
    addItem,
    itemInputRef,
}: IPosBillingEntryRowProps) {
    const rowRef = useRef<HTMLTableRowElement>(null);

    function focusItem() {
        (
            itemInputRef?.current ??
            rowRef.current?.querySelector<HTMLInputElement>('[data-col="item"]')
        )?.focus();
    }

    const search = usePosItemSearch((row: ISearchProductRow) => {
        // Add the picked product straight away at quantity 1, then re-focus the
        // Item field for the next product. The refocus runs on the next frame
        // because committing the first line mounts page-level UI (the payment
        // panel appears once the cart is non-empty) that can otherwise steal
        // focus — and an unfocused grid lets the global barcode scan wedge
        // swallow the cashier's next keystrokes.
        addItem({
            ...toCartItemSeed(row),
            quantity: 1,
            discountPercentage: 0,
        });
        requestAnimationFrame(focusItem);
    });

    const showDropdown = search.query.trim().length > 0;

    return (
        <>
            <tr ref={rowRef}>
                <td
                    className={`${CELL} text-right text-[12px] font-semibold tabular-nums text-primary`}
                >
                    {serial}
                </td>
                <td className={`${CELL} text-left`}>
                    <input
                        ref={itemInputRef}
                        data-row-id="entry"
                        data-col="item"
                        type="text"
                        autoComplete="off"
                        value={search.query}
                        placeholder="Type item name or code…"
                        onChange={(e) => search.onQueryChange(e.target.value)}
                        onKeyDown={search.handleInputKeyDown}
                        aria-label="Add item"
                        className="w-full h-7 px-2 text-[13px] text-primary font-medium bg-surface border border-primary/60 rounded outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                    />
                </td>
                <td className={`${PLACEHOLDER} text-right`}>—</td>
                <td className={`${PLACEHOLDER} text-left uppercase`}>—</td>
                <td className={`${PLACEHOLDER} text-right`}>—</td>
                <td className={`${PLACEHOLDER} text-right`}>—</td>
                <td className={`${PLACEHOLDER} text-right`}>—</td>
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
