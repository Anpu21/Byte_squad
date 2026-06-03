import { isPartialDecimal } from '@/lib/numeric-input';
import { inputClasses } from '../lib/input-classes';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';

interface SellableUnitRowProps {
    row: ISellableUnitRow;
    canRemove: boolean;
    onUpdate: (
        rowId: string,
        patch: Partial<Omit<ISellableUnitRow, 'rowId'>>,
    ) => void;
    onSetBase: (rowId: string) => void;
    onRemove: (rowId: string) => void;
}

export function SellableUnitRow({
    row,
    canRemove,
    onUpdate,
    onSetBase,
    onRemove,
}: SellableUnitRowProps) {
    function handleNameChange(value: string) {
        onUpdate(row.rowId, { name: value });
    }

    function handleBarcodeChange(value: string) {
        onUpdate(row.rowId, { barcode: value });
    }

    function handleConversionChange(value: string) {
        if (isPartialDecimal(value)) {
            onUpdate(row.rowId, { conversionToBase: value });
        }
    }

    function handleSellingPriceChange(value: string) {
        if (isPartialDecimal(value)) {
            onUpdate(row.rowId, { sellingPrice: value });
        }
    }

    function handleDisplayOrderChange(value: string) {
        if (value === '') {
            onUpdate(row.rowId, { displayOrder: 0 });
            return;
        }
        const parsed = parseInt(value, 10);
        if (!Number.isNaN(parsed) && parsed >= 0) {
            onUpdate(row.rowId, { displayOrder: parsed });
        }
    }

    return (
        <tr className="border-b border-border-strong/60 last:border-b-0">
            <td className="px-3 py-2">
                <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className={inputClasses(false, 'w-32')}
                    aria-label="Unit name"
                    placeholder="e.g. kg"
                />
            </td>
            <td className="px-3 py-2">
                <input
                    type="text"
                    value={row.barcode}
                    onChange={(e) => handleBarcodeChange(e.target.value)}
                    className={inputClasses(false, 'w-36 mono')}
                    aria-label="Unit barcode"
                    placeholder="Optional"
                />
            </td>
            <td className="px-3 py-2 text-center">
                <input
                    type="radio"
                    name="product-base-row"
                    checked={row.isBase}
                    onChange={() => onSetBase(row.rowId)}
                    aria-label={`Set ${row.name || 'this row'} as base unit`}
                    className="accent-primary"
                />
            </td>
            <td className="px-3 py-2 text-right">
                <input
                    type="text"
                    inputMode="decimal"
                    value={row.conversionToBase}
                    onChange={(e) => handleConversionChange(e.target.value)}
                    className={inputClasses(false, 'w-28 text-right mono')}
                    aria-label="Conversion to base"
                    disabled={row.isBase}
                />
            </td>
            <td className="px-3 py-2 text-right">
                <input
                    type="text"
                    inputMode="decimal"
                    value={row.sellingPrice}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    className={inputClasses(false, 'w-28 text-right mono')}
                    aria-label="Unit selling price"
                    placeholder={row.isBase ? 'Base price' : '0.00'}
                    disabled={row.isBase}
                />
            </td>
            <td className="px-3 py-2 text-right">
                <input
                    type="text"
                    inputMode="numeric"
                    value={String(row.displayOrder)}
                    onChange={(e) => handleDisplayOrderChange(e.target.value)}
                    className={inputClasses(false, 'w-20 text-right mono')}
                    aria-label="Display order"
                />
            </td>
            <td className="px-3 py-2 text-center">
                <button
                    type="button"
                    onClick={() => onRemove(row.rowId)}
                    className="text-text-2 hover:text-danger transition-colors text-[12px] font-medium disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-2"
                    aria-label={`Remove ${row.name || 'unit'}`}
                    disabled={!canRemove}
                >
                    Remove
                </button>
            </td>
        </tr>
    );
}
