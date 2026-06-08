import { Trash2 } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IProductUnitRow } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PosUnitSelect } from '@/features/pos/components/item-table/PosUnitSelect';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosBillingGridRowProps {
    index: number;
    item: ICartItem;
    onUpdate: (rowId: string, patch: Partial<ICartItem>) => void;
    onRemove: (rowId: string) => void;
}

const CELL = 'border-r border-b border-border px-2 py-1.5 align-middle';
const NUM_INPUT =
    'w-full h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed';

/**
 * One committed line in the billing grid. Widths come from the shared
 * `<colgroup>` (see `columns.tsx`); each numeric cell keeps `data-row-id` /
 * `data-col` for keyboard nav and `selectOnFocus` for instant overwrite.
 */
export function PosBillingGridRow({
    index,
    item,
    onUpdate,
    onRemove,
}: IPosBillingGridRowProps) {
    function handleUnit(unit: IProductUnitRow) {
        onUpdate(item.rowId, {
            unitId: unit.unitId,
            unitName: unit.unitName,
            unitPrice: unit.sellingPrice,
            conversionFactor: unit.conversionToBase,
        });
    }

    return (
        <tr className="hover:bg-surface-2/40">
            <td className={`${CELL} text-right text-[12px] text-text-3 tabular-nums`}>
                {index + 1}
            </td>
            <td className={`${CELL} font-mono text-[12px] text-text-2 truncate`}>
                {item.productCode}
            </td>
            <td className={`${CELL} text-[13px] text-text-1`}>
                <div className="truncate">{item.productName}</div>
                <div className="text-[11px] text-text-3 truncate">
                    {item.productType}
                </div>
            </td>
            <td className={CELL}>
                <PosUnitSelect
                    productId={item.productId}
                    value={item.unitId}
                    onChange={handleUnit}
                />
            </td>
            <td className={`${CELL} text-right text-[12px] text-text-1 tabular-nums`}>
                {formatCurrency(item.unitPrice)}
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
            <td className={CELL}>
                <PosCartNumericCell
                    value={item.quantity}
                    onCommit={(next) => onUpdate(item.rowId, { quantity: next })}
                    min={0}
                    ariaLabel="Quantity"
                    dataRowId={item.rowId}
                    dataCol="qty"
                    selectOnFocus
                    className={NUM_INPUT}
                />
            </td>
            <td className={`${CELL} text-right text-[13px] font-semibold text-text-1 tabular-nums`}>
                {formatCurrency(item.lineTotal)}
            </td>
            <td className={`${CELL} text-center`}>
                <button
                    type="button"
                    onClick={() => onRemove(item.rowId)}
                    aria-label={`Remove ${item.productName}`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-text-3 hover:text-danger hover:bg-danger-soft focus:outline-none focus:ring-[2px] focus:ring-danger/30 transition-colors"
                >
                    <Trash2 size={14} aria-hidden />
                </button>
            </td>
        </tr>
    );
}
