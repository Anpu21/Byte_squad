import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IProductUnitRow } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { usePosItemSearch } from '@/features/pos/hooks/usePosItemSearch';
import { toCartItemSeed } from '@/features/pos/lib/cart-item-seed';
import { PosUnitSelect } from '@/features/pos/components/item-table/PosUnitSelect';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';
import { PosItemSearchDropdown } from './PosItemSearchDropdown';

interface IPosBillingGridRowProps {
    index: number;
    item: ICartItem;
    onUpdate: (rowId: string, patch: Partial<ICartItem>) => void;
    onRemove: (rowId: string) => void;
}

const CELL = 'border-r border-b border-border px-2 py-1 align-middle';
const NUM_INPUT =
    'w-full h-7 px-2 text-right text-[12px] text-primary font-medium bg-surface border border-border-strong rounded outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * One committed line in the BUSY-style grid — fully editable inline. The Item
 * cell shows the product name and, on click, becomes a search field to re-pick
 * the product; Qty / Price / Disc % are editable numeric cells. Widths come
 * from the shared `<colgroup>`; numeric cells keep `data-row-id` / `data-col`
 * for keyboard nav. Removal is a hover trash button or Ctrl+Del.
 */
export function PosBillingGridRow({
    index,
    item,
    onUpdate,
    onRemove,
}: IPosBillingGridRowProps) {
    const itemRef = useRef<HTMLInputElement>(null);
    const blurTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );
    const [editing, setEditing] = useState(false);

    const search = usePosItemSearch(
        (row) => {
            const seed = toCartItemSeed(row);
            onUpdate(item.rowId, {
                productId: seed.productId,
                productCode: seed.productCode,
                productName: seed.productName,
                productType: seed.productType,
                baseUnit: seed.baseUnit,
                unitId: seed.unitId,
                unitName: seed.unitName,
                unitPrice: seed.unitPrice,
                conversionFactor: seed.conversionFactor,
                taxRate: seed.taxRate,
                discountAllowed: seed.discountAllowed,
            });
            setEditing(false);
        },
        () => setEditing(false),
    );

    useEffect(() => {
        if (editing) itemRef.current?.focus();
    }, [editing]);

    useEffect(() => () => clearTimeout(blurTimer.current), []);

    function handleUnit(unit: IProductUnitRow) {
        onUpdate(item.rowId, {
            unitId: unit.unitId,
            unitName: unit.unitName,
            unitPrice: unit.sellingPrice,
            conversionFactor: unit.conversionToBase,
        });
    }

    function startEdit() {
        search.clear();
        setEditing(true);
    }

    // Delay so a click on the (portalled) dropdown registers before we close.
    function handleItemBlur() {
        blurTimer.current = setTimeout(() => setEditing(false), 150);
    }

    return (
        <>
            <tr className="group hover:bg-surface-2/40">
                <td className={`${CELL} text-right text-[12px] tabular-nums text-text-3`}>
                    {index + 1}
                </td>
                <td className={`${CELL} text-left relative`}>
                    {editing ? (
                        <input
                            ref={itemRef}
                            type="text"
                            autoComplete="off"
                            value={search.query}
                            placeholder="Type item name or code…"
                            onChange={(e) =>
                                search.onQueryChange(e.target.value)
                            }
                            onKeyDown={search.handleInputKeyDown}
                            onBlur={handleItemBlur}
                            aria-label={`Edit item ${index + 1}`}
                            className="w-full h-7 px-2 text-[13px] text-primary font-medium bg-surface border border-primary/60 rounded outline-none focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={startEdit}
                            title={item.productName}
                            className="w-full text-left truncate text-[13px] font-medium text-primary hover:underline"
                        >
                            {item.productName}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onRemove(item.rowId)}
                        aria-label={`Remove ${item.productName}`}
                        className="opacity-0 group-hover:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-5 h-5 rounded bg-surface text-text-3 hover:text-danger hover:bg-danger-soft transition-opacity"
                    >
                        <Trash2 size={12} aria-hidden />
                    </button>
                </td>
                <td className={CELL}>
                    <PosCartNumericCell
                        value={item.quantity}
                        onCommit={(next) =>
                            onUpdate(item.rowId, { quantity: next })
                        }
                        min={0}
                        ariaLabel="Quantity"
                        dataRowId={item.rowId}
                        dataCol="qty"
                        selectOnFocus
                        className={NUM_INPUT}
                    />
                </td>
                <td className={CELL}>
                    <PosUnitSelect
                        productId={item.productId}
                        value={item.unitId}
                        onChange={handleUnit}
                    />
                </td>
                <td className={CELL}>
                    <PosCartNumericCell
                        value={item.unitPrice}
                        onCommit={(next) =>
                            onUpdate(item.rowId, { unitPrice: next })
                        }
                        min={0}
                        ariaLabel="Price"
                        dataRowId={item.rowId}
                        dataCol="price"
                        selectOnFocus
                        className={NUM_INPUT}
                    />
                </td>
                <td className={CELL}>
                    <PosCartNumericCell
                        value={item.discountPercentage}
                        onCommit={(next) =>
                            onUpdate(item.rowId, { discountPercentage: next })
                        }
                        min={0}
                        max={100}
                        disabled={!item.discountAllowed}
                        ariaLabel="Discount percentage"
                        dataRowId={item.rowId}
                        dataCol="disc"
                        selectOnFocus
                        className={NUM_INPUT}
                    />
                </td>
                <td className={`${CELL} text-right text-[13px] font-semibold text-primary tabular-nums`}>
                    {formatCurrency(item.lineTotal)}
                </td>
            </tr>
            <PosItemSearchDropdown
                open={editing && search.query.trim().length > 0}
                inputRef={itemRef}
                results={search.results}
                isFetching={search.isFetching}
                query={search.debounced || search.query.trim()}
                highlight={search.highlight}
                onSelect={search.selectRow}
            />
        </>
    );
}
