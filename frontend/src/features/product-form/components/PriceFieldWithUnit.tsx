import type { ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER, FIELD_ERROR } from '@/components/ui';
import { FormField } from './FormField';
import { normalizePriceToBaseUnit } from '../lib/normalize-price';
import type { ISellableUnitRow } from '../types/sellable-unit-row.type';
import type { TBaseUnitFe } from '../lib/sellable-units';

interface PriceFieldWithUnitProps {
    id: string;
    name: 'sellingPrice' | 'costPrice';
    label: string;
    value: string;
    onChange: (next: string) => void;
    /** Quantity of `unit` the entered price covers (e.g. "0.5" for 0.5 kg). */
    qty: string;
    onQtyChange: (next: string) => void;
    unit: string;
    onUnitChange: (next: string) => void;
    units: readonly ISellableUnitRow[];
    baseUnit: TBaseUnitFe;
    error?: string;
}

/**
 * Build the small "= Rs X / kg" caption underneath each price input — the
 * per-1-base-unit value we will actually store. When the price is already
 * per 1 base unit (unit IS the base AND basis qty is 1) we render
 * `per <baseUnit>` instead, since "= Rs 500 / kg" for a plain "500 per 1 kg"
 * entry would only add noise. Returns null while the input is empty or
 * parsing fails so the caller can skip rendering.
 */
function computePreview(
    rawPrice: string,
    rawQty: string,
    unitName: string,
    units: readonly ISellableUnitRow[],
    baseUnit: TBaseUnitFe,
): string | null {
    const qty = rawQty.trim() === '' ? 1 : Number(rawQty);
    if (unitName === baseUnit && qty === 1) {
        return `per ${baseUnit}`;
    }
    if (!rawPrice.trim()) {
        return null;
    }
    const n = Number(rawPrice);
    if (!Number.isFinite(n) || n < 0) {
        return null;
    }
    try {
        const normalized = normalizePriceToBaseUnit(n, unitName, units, qty);
        return `= Rs ${normalized.toFixed(2)} / ${baseUnit}`;
    } catch {
        return null;
    }
}

export function PriceFieldWithUnit({
    id,
    name,
    label,
    value,
    onChange,
    qty,
    onQtyChange,
    unit,
    onUnitChange,
    units,
    baseUnit,
    error,
}: PriceFieldWithUnitProps) {
    function handleUnitChange(e: ChangeEvent<HTMLSelectElement>) {
        onUnitChange(e.target.value);
    }

    const preview = computePreview(value, qty, unit, units, baseUnit);
    const unitSelectId = `${id}-unit`;
    const qtyInputId = `${id}-qty`;
    // Defensive: useSellableUnitsState always seeds at least the base row,
    // but if a hydration race ever left units empty we'd rather disable
    // the dropdown than render an unusable empty <select>.
    const disableUnitSelect = units.length === 0;

    return (
        <FormField label={label} htmlFor={id} error={error}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3 text-xs font-medium">
                        Rs
                    </span>
                    <input
                        id={id}
                        name={name}
                        type="number"
                        step="0.01"
                        min="0"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        aria-invalid={Boolean(error)}
                        className={cn(
                            FIELD_SHELL,
                            error ? FIELD_ERROR : FIELD_BORDER,
                            'w-full h-[38px] pl-9 pr-3 mono',
                        )}
                        placeholder="0.00"
                    />
                </div>
                <span className="shrink-0 self-center text-[11px] text-text-3">
                    per
                </span>
                <label htmlFor={qtyInputId} className="sr-only">
                    {`${label} per quantity`}
                </label>
                <input
                    id={qtyInputId}
                    type="text"
                    inputMode="decimal"
                    value={qty}
                    onChange={(e) => onQtyChange(e.target.value)}
                    aria-label={`${label} per quantity`}
                    className={cn(
                        FIELD_SHELL,
                        FIELD_BORDER,
                        'h-[38px] w-14 px-2 text-center mono',
                    )}
                    placeholder="1"
                />
                <label htmlFor={unitSelectId} className="sr-only">
                    {`${label} unit`}
                </label>
                <select
                    id={unitSelectId}
                    value={unit}
                    onChange={handleUnitChange}
                    disabled={disableUnitSelect}
                    className={cn(
                        FIELD_SHELL,
                        FIELD_BORDER,
                        'h-[38px] min-w-[64px] px-2',
                    )}
                >
                    {units.map((row) => (
                        <option key={row.rowId} value={row.name}>
                            {row.name || '—'}
                        </option>
                    ))}
                </select>
            </div>
            {preview && (
                <p className="text-[11px] text-text-2 mt-1 mono">{preview}</p>
            )}
        </FormField>
    );
}
