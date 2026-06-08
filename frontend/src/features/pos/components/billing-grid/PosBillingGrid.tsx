import {
    useRef,
    useState,
    type KeyboardEvent,
    type ReactNode,
    type RefObject,
} from 'react';
import { Camera, ShoppingCart, Trash2 } from 'lucide-react';
import { useConfirm } from '@/hooks/useConfirm';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { UsePosCartReturn } from '@/features/pos/hooks/usePosCart';
import { PosCameraScannerModal } from '@/features/pos/components/item-table/PosCameraScannerModal';
import { PosBillingGridRow } from './PosBillingGridRow';
import { PosBillingEntryRow } from './PosBillingEntryRow';

interface IPosBillingGridProps {
    cart: ICartItem[];
    addItem: UsePosCartReturn['addItem'];
    updateItem: (rowId: string, patch: Partial<ICartItem>) => void;
    removeItem: (rowId: string) => void;
    onClear: () => void;
    /** Item field ref (the entry row) — F2 / post-checkout refocus. */
    searchInputRef?: RefObject<HTMLInputElement | null>;
    onScanBarcode?: (barcode: string) => void;
    footerSlot?: ReactNode;
}

const HEADERS: { label: string; align?: 'left' | 'right' | 'center' }[] = [
    { label: '#', align: 'right' },
    { label: 'Code' },
    { label: 'Description' },
    { label: 'MRP', align: 'right' },
    { label: 'Unit' },
    { label: 'Price', align: 'right' },
    { label: 'Disc %' },
    { label: 'Tax %' },
    { label: 'Qty' },
    { label: 'Free' },
    { label: 'Amount', align: 'right' },
    { label: '', align: 'center' },
];

/**
 * BUSY/Tally-style cashier billing grid. Replaces the click-and-blur cart
 * table: committed lines sit in a navigable grid (↑/↓ move the same column
 * across rows, Enter commits a cell and drops down, Ctrl+Delete removes a
 * row, Esc returns to the entry field) and a pinned entry row at the bottom
 * builds the next line keyboard-first. Reuses `usePosCart`, the product
 * search, units, and line math unchanged — only the interaction model is new.
 */
export function PosBillingGrid({
    cart,
    addItem,
    updateItem,
    removeItem,
    onClear,
    searchInputRef,
    onScanBarcode,
    footerSlot,
}: IPosBillingGridProps) {
    const bodyRef = useRef<HTMLDivElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const confirm = useConfirm();

    function focusCell(rowId: string, col: string) {
        bodyRef.current
            ?.querySelector<HTMLInputElement>(
                `[data-row-id="${rowId}"][data-col="${col}"]`,
            )
            ?.focus();
    }

    function focusEntryItem() {
        searchInputRef?.current?.focus();
    }

    function handleGridKey(e: KeyboardEvent<HTMLDivElement>) {
        const el = e.target as HTMLElement;
        const rowId = el.dataset?.rowId;
        const col = el.dataset?.col;
        // Entry-row cells (data-row-id="entry") own their keys; ignore here.
        if (!rowId || rowId === 'entry' || !col) return;
        const idx = cart.findIndex((c) => c.rowId === rowId);
        if (idx === -1) return;

        if (e.key === 'Enter' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = cart[idx + 1];
            if (next) focusCell(next.rowId, col);
            else focusEntryItem();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = cart[idx - 1];
            if (prev) focusCell(prev.rowId, col);
        } else if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === 'Delete' || e.key === 'Backspace')
        ) {
            e.preventDefault();
            const fallback = cart[idx + 1] ?? cart[idx - 1];
            removeItem(rowId);
            if (fallback) focusCell(fallback.rowId, col);
            else focusEntryItem();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            focusEntryItem();
        }
    }

    return (
        <section
            aria-label="Cart items"
            className="bg-surface border border-border-strong rounded-md flex flex-col h-[calc(100vh-130px)] min-h-[600px]"
        >
            <header className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-border-strong">
                <h2 className="text-sm font-semibold text-text-1">Items</h2>
                <div className="flex items-center gap-2">
                    {onScanBarcode && (
                        <button
                            type="button"
                            onClick={() => setShowCamera(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border-strong bg-surface-2 text-text-1 hover:bg-primary-soft hover:text-primary-soft-text transition-colors text-[12px] font-medium"
                            aria-label="Open camera barcode scanner"
                            title="Scan a barcode with the camera"
                        >
                            <Camera size={14} aria-hidden />
                            <span className="hidden sm:inline">Scan</span>
                        </button>
                    )}
                    {cart.length > 0 && (
                        <button
                            type="button"
                            onClick={async () => {
                                const ok = await confirm({
                                    title: 'Clear the cart?',
                                    body: 'All rows in the current sale will be removed.',
                                    confirmLabel: 'Clear cart',
                                    tone: 'danger',
                                });
                                if (ok) onClear();
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium text-danger hover:bg-danger-soft rounded-md transition-colors"
                        >
                            <Trash2 size={14} /> Clear All
                        </button>
                    )}
                </div>
            </header>

            {onScanBarcode && (
                <PosCameraScannerModal
                    isOpen={showCamera}
                    onClose={() => setShowCamera(false)}
                    onScan={onScanBarcode}
                />
            )}

            <div
                ref={bodyRef}
                onKeyDown={handleGridKey}
                className="flex-1 flex flex-col min-h-0"
            >
                <div className="flex-1 overflow-auto">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
                            <ShoppingCart
                                size={20}
                                className="text-text-3 mb-2"
                                aria-hidden
                            />
                            <p className="text-sm font-medium text-text-1">
                                No items yet
                            </p>
                            <p className="text-xs text-text-3 mt-1">
                                Type a product in the line below, press Enter, then a
                                quantity.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-[12px]">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-surface-2 border-b border-border-strong">
                                    {HEADERS.map((h, i) => (
                                        <th
                                            key={`${h.label}-${i}`}
                                            scope="col"
                                            className={`px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-text-2 ${
                                                h.align === 'right'
                                                    ? 'text-right'
                                                    : h.align === 'center'
                                                      ? 'text-center'
                                                      : 'text-left'
                                            }`}
                                        >
                                            {h.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, index) => (
                                    <PosBillingGridRow
                                        key={item.rowId}
                                        index={index}
                                        item={item}
                                        onUpdate={updateItem}
                                        onRemove={removeItem}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <PosBillingEntryRow
                    addItem={addItem}
                    itemInputRef={searchInputRef}
                />
            </div>

            {footerSlot && (
                <div className="shrink-0 border-t border-border-strong">
                    {footerSlot}
                </div>
            )}
        </section>
    );
}
