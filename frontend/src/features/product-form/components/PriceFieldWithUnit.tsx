import type { ChangeEvent } from 'react';
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
    unit: string;
    onUnitChange: (next: string) => void;
    units: readonly ISellableUnitRow[];
    baseUnit: TBaseUnitFe;
    error?: string;
}

/**
 * Build the small "= Rs X / kg" caption underneath each price input. When
 * the chosen unit IS the base unit we render `per <baseUnit>` instead — a
 * redundant "= Rs 500 / kg" when the manager just typed 500 in the `kg`
 * row would only add noise. Returns null while the input is empty or
 * parsing fails so the caller can skip rendering.
 */
function computePreview(
    rawPrice: string,
    unitName: string,
    units: readonly ISellableUnitRow[],
    baseUnit: TBaseUnitFe,
): string | null {
    if (unitName === baseUnit) {
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
        const normalized = normalizePriceToBaseUnit(n, unitName, units);
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
    unit,
    onUnitChange,
    units,
    baseUnit,
    error,
}: PriceFieldWithUnitProps) {
    function handleUnitChange(e: ChangeEvent<HTMLSelectElement>) {
        onUnitChange(e.target.value);
    }

    const preview = computePreview(value, unit, units, baseUnit);
    const unitSelectId = `${id}-unit`;
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
                        className={`w-full h-[38px] pl-9 pr-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors mono focus:border-primary focus:ring-[3px] focus:ring-primary/30 ${
                            error
                                ? 'border-danger'
                                : 'border-border-strong hover:border-text-3'
                        }`}
                        placeholder="0.00"
                    />
                </div>
                <label htmlFor={unitSelectId} className="sr-only">
                    {`${label} per`}
                </label>
                <select
                    id={unitSelectId}
                    value={unit}
                    onChange={handleUnitChange}
                    disabled={disableUnitSelect}
                    className="h-[38px] px-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30 hover:border-text-3 disabled:opacity-60 disabled:cursor-not-allowed min-w-[72px]"
                >
                    {units.map((row) => (
                        <option key={row.rowId} value={row.name}>
                            {`per ${row.name || '—'}`}
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
