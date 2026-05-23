import { useEffect, useState } from 'react';
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

type TNumericField =
    | 'quantity'
    | 'free'
    | 'discountPercentage'
    | 'taxRate';

interface INumericBounds {
    min: number;
    max?: number;
}

/**
 * One editable row inside the cart table. Each numeric cell keeps its own
 * string buffer so partial entries like `0.`, `.5`, or a blank string don't
 * collapse to `0` mid-typing. The committed numeric value is written through
 * `onUpdate` on every full-number change and again on blur, and is clamped
 * defensively against `min`/`max` so paste/programmatic-set can't push the
 * field out of range.
 *
 * The discount cell is disabled when the product was flagged
 * `discountAllowed: false` on the search row (a Shanel rule used for
 * items like tobacco / gift cards). Tax % follows the product's taxRate
 * by default and stays editable so a cashier can override per line if a
 * store policy demands.
 */
export function PosCartRow({ item, onUpdate, onRemove }: IPosCartRowProps) {
    const [qtyBuffer, setQtyBuffer] = useState<string>(String(item.quantity));
    const [freeBuffer, setFreeBuffer] = useState<string>(String(item.free));
    const [discBuffer, setDiscBuffer] = useState<string>(
        String(item.discountPercentage),
    );
    const [taxBuffer, setTaxBuffer] = useState<string>(String(item.taxRate));

    // Sync buffers when the upstream item changes (line-math recompute,
    // unit switch, merge with a sibling row, etc.). Each effect is keyed
    // on the specific field so unrelated upstream updates don't stomp the
    // user's in-flight edit on another cell.
    useEffect(() => {
        setQtyBuffer(String(item.quantity));
    }, [item.quantity]);
    useEffect(() => {
        setFreeBuffer(String(item.free));
    }, [item.free]);
    useEffect(() => {
        setDiscBuffer(String(item.discountPercentage));
    }, [item.discountPercentage]);
    useEffect(() => {
        setTaxBuffer(String(item.taxRate));
    }, [item.taxRate]);

    const clamp = (value: number, bounds: INumericBounds): number => {
        const lower = Math.max(value, bounds.min);
        return bounds.max !== undefined ? Math.min(lower, bounds.max) : lower;
    };

    const commitNumeric = (
        buffer: string,
        field: TNumericField,
        bounds: INumericBounds,
    ): void => {
        const parsed = parseFloat(buffer);
        if (!Number.isFinite(parsed)) return;
        const clamped = clamp(parsed, bounds);
        if (clamped !== item[field]) {
            onUpdate(item.rowId, { [field]: clamped });
        }
    };

    // A buffer is "complete" when it parses to a finite number and matches
    // a canonical numeric string (no trailing `.`, no lone `-`, no empty
    // string). Used to live-commit while still allowing in-progress entries
    // like `0.` to remain in the buffer.
    const isCompleteNumber = (raw: string): boolean => {
        if (raw.trim() === '') return false;
        return /^-?\d+(\.\d+)?$/.test(raw.trim());
    };

    const handleChange = (
        next: string,
        field: TNumericField,
        bounds: INumericBounds,
        setBuffer: (value: string) => void,
    ): void => {
        setBuffer(next);
        if (isCompleteNumber(next)) {
            commitNumeric(next, field, bounds);
        }
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
                    value={discBuffer}
                    onChange={(e) =>
                        handleChange(
                            e.target.value,
                            'discountPercentage',
                            { min: 0, max: 100 },
                            setDiscBuffer,
                        )
                    }
                    onBlur={() =>
                        commitNumeric(discBuffer, 'discountPercentage', {
                            min: 0,
                            max: 100,
                        })
                    }
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
                    value={taxBuffer}
                    onChange={(e) =>
                        handleChange(
                            e.target.value,
                            'taxRate',
                            { min: 0, max: 100 },
                            setTaxBuffer,
                        )
                    }
                    onBlur={() =>
                        commitNumeric(taxBuffer, 'taxRate', {
                            min: 0,
                            max: 100,
                        })
                    }
                    aria-label="Tax rate"
                    className="w-16 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={qtyBuffer}
                    onChange={(e) =>
                        handleChange(
                            e.target.value,
                            'quantity',
                            { min: 0 },
                            setQtyBuffer,
                        )
                    }
                    onBlur={() =>
                        commitNumeric(qtyBuffer, 'quantity', { min: 0 })
                    }
                    aria-label="Quantity"
                    className="w-20 h-8 px-2 text-right text-[12px] text-text-1 bg-surface border border-border-strong rounded-md outline-none tabular-nums focus:border-primary focus:ring-[2px] focus:ring-primary/30"
                />
            </td>
            <td className="px-2 py-2 align-middle">
                <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={freeBuffer}
                    onChange={(e) =>
                        handleChange(
                            e.target.value,
                            'free',
                            { min: 0 },
                            setFreeBuffer,
                        )
                    }
                    onBlur={() =>
                        commitNumeric(freeBuffer, 'free', { min: 0 })
                    }
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
