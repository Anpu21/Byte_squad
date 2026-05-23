import type { ChangeEvent } from 'react';
import { Trash2 } from 'lucide-react';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IProductUnitRow } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { PosUnitSelect } from './PosUnitSelect';

interface IPosCartRowProps {
    item: ICartItem;
    onUpdate: (rowId: string, patch: Partial<ICartItem>) => void;
    onRemove: (rowId: string) => void;
}

/**
 * One editable row inside the cart table. Numerical cells (qty, free,
 * discount %, tax %) write live through `onUpdate` so `computeLine` runs
 * on every keystroke — POS UIs want the total to react immediately.
 *
 * The discount cell is disabled when the product was flagged
 * `discountAllowed: false` on the search row (a Shanel rule used for
 * items like tobacco / gift cards). Tax % follows the product's taxRate
 * by default and stays editable so a cashier can override per line if a
 * store policy demands.
 */
export function PosCartRow({ item, onUpdate, onRemove }: IPosCartRowProps) {
    const numericPatch =
        (field: keyof ICartItem) =>
        (e: ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            const value = raw === '' ? 0 : Number(raw);
            if (Number.isNaN(value)) return;
            onUpdate(item.rowId, { [field]: value });
        };

    function handleUnit(unit: IProductUnitRow) {
        onUpdate(item.rowId, {
            unitId: unit.unitId,
            unitName: unit.unitName,
            conversionFactor: unit.conversionToBase,
        });
    }

    return (
        <tr className="border-b border-border-strong last:border-b-0">
            <td className="px-3 py-2 text-[12px] font-mono text-text-2 align-middle">
                {item.productCode}
            </td>
            <td className="px-3 py-2 text-[13px] text-text-1 align-middle">
                <div className="truncate max-w-[220px]">{item.productName}</div>
                <div className="text-[11px] text-text-3">
                    {item.productType}
                </div>
            </td>
            <td className="px-2 py-2 align-middle">
                <PosUnitSelect
                    productId={item.productId}
                    value={item.unitId}
                    onChange={handleUnit}
                />
            </td>
            <td className="px-3 py-2 text-right text-[12px] text-text-1 tabular-nums align-middle">
                {formatCurrency(item.unitPrice)}
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={item.discountPercentage}
                    onChange={numericPatch('discountPercentage')}
                    disabled={!item.discountAllowed}
                    aria-label="Discount percentage"
                    className="w-16 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={item.taxRate}
                    onChange={numericPatch('taxRate')}
                    aria-label="Tax rate"
                    className="w-16 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.quantity}
                    onChange={numericPatch('quantity')}
                    aria-label="Quantity"
                    className="w-20 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.free}
                    onChange={numericPatch('free')}
                    aria-label="Free units"
                    className="w-16 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                />
            </td>
            <td className="px-3 py-2 text-right text-[13px] font-semibold text-text-1 tabular-nums align-middle">
                {formatCurrency(item.lineTotal)}
            </td>
            <td className="px-2 py-2 text-center align-middle">
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
