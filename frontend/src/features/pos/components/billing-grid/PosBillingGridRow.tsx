import { Trash2 } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IProductUnitRow } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PosUnitSelect } from '@/features/pos/components/item-table/PosUnitSelect';
import { PosCartNumericCell } from '@/features/pos/components/item-table/PosCartNumericCell';

interface IPosBillingGridRowProps {
    item: ICartItem;
    onUpdate: (rowId: string, patch: Partial<ICartItem>) => void;
    onRemove: (rowId: string) => void;
}

const NUMERIC_INPUT_CLASS =
    'w-16 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed';

const QUANTITY_INPUT_CLASS =
    'w-20 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30';

/**
 * One committed line in the billing grid. Each numeric cell carries
 * `data-row-id` / `data-col` so the grid's keyboard handler can move focus
 * between cells (↑/↓ across rows, Enter down) and `selectOnFocus` so landing
 * on a cell selects it for instant overwrite — the BUSY/Tally feel. The
 * underlying buffer + clamp semantics are unchanged (`PosCartNumericCell`).
 */
export function PosBillingGridRow({
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
        <tr className="border-b border-border-strong last:border-b-0 hover:bg-surface-2/40">
            <td className="px-3 py-1.5 text-[12px] font-mono text-text-2 align-middle">
                {item.productCode}
            </td>
            <td className="px-3 py-1.5 text-[13px] text-text-1 align-middle">
                <div className="truncate max-w-[220px]">{item.productName}</div>
                <div className="text-[11px] text-text-3">{item.productType}</div>
            </td>
            <td className="px-2 py-1.5 align-middle">
                <PosUnitSelect
                    productId={item.productId}
                    value={item.unitId}
                    onChange={handleUnit}
                />
            </td>
            <td className="px-3 py-1.5 text-right text-[12px] text-text-1 tabular-nums align-middle">
                {formatCurrency(item.unitPrice)}
            </td>
            <td className="px-2 py-1.5 align-middle">
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
                    className={NUMERIC_INPUT_CLASS}
                />
            </td>
            <td className="px-2 py-1.5 align-middle">
                <PosCartNumericCell
                    value={item.taxRate}
                    onCommit={(next) => onUpdate(item.rowId, { taxRate: next })}
                    min={0}
                    max={100}
                    ariaLabel="Tax rate"
                    dataRowId={item.rowId}
                    dataCol="tax"
                    selectOnFocus
                    className={NUMERIC_INPUT_CLASS}
                />
            </td>
            <td className="px-2 py-1.5 align-middle">
                <PosCartNumericCell
                    value={item.quantity}
                    onCommit={(next) => onUpdate(item.rowId, { quantity: next })}
                    min={0}
                    ariaLabel="Quantity"
                    dataRowId={item.rowId}
                    dataCol="qty"
                    selectOnFocus
                    className={QUANTITY_INPUT_CLASS}
                />
            </td>
            <td className="px-2 py-1.5 align-middle">
                <PosCartNumericCell
                    value={item.free}
                    onCommit={(next) => onUpdate(item.rowId, { free: next })}
                    min={0}
                    ariaLabel="Free units"
                    dataRowId={item.rowId}
                    dataCol="free"
                    selectOnFocus
                    className={NUMERIC_INPUT_CLASS}
                />
            </td>
            <td className="px-3 py-1.5 text-right text-[13px] font-semibold text-text-1 tabular-nums align-middle">
                {formatCurrency(item.lineTotal)}
            </td>
            <td className="px-2 py-1.5 text-center align-middle">
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
