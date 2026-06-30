import type { ChangeEvent } from 'react';
import { usePosProductUnits } from '@/features/pos/hooks/usePosProductUnits';
import type { IProductUnitRow } from '@/types';
import { cn } from '@/lib/utils';
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui';

interface IPosUnitSelectProps {
    productId: string | null;
    /** Currently picked unitId on the cart row, or null for the base unit. */
    value: string | null;
    onChange: (unit: IProductUnitRow) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Per-row unit dropdown populated from `GET /pos/products/:id/units`. The
 * base unit is always first; secondary units (e.g. `g`, `case`) follow in
 * `displayOrder`. Selecting an option emits the full `IProductUnitRow`
 * so the cart row can capture both `unitId` and `conversionToBase` in one
 * call without a second lookup.
 */
export function PosUnitSelect({
    productId,
    value,
    onChange,
    disabled = false,
    className,
}: IPosUnitSelectProps) {
    const unitsQuery = usePosProductUnits(productId);
    const units = unitsQuery.data ?? [];
    const isLoading = unitsQuery.isLoading;
    const baseUnit = units.find((u) => u.isBaseUnit);

    function handleChange(e: ChangeEvent<HTMLSelectElement>) {
        const picked = units.find((u) => u.unitId === e.target.value);
        if (picked) onChange(picked);
    }

    return (
        <select
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled || isLoading || !productId}
            aria-label="Unit"
            className={cn(
                FIELD_SHELL,
                FIELD_BORDER,
                'h-8 px-2 text-[12px]',
                className,
            )}
        >
            {value === null && (
                <option value="">
                    {isLoading
                        ? 'Loading…'
                        : (baseUnit?.unitName?.toUpperCase() ?? 'Base unit')}
                </option>
            )}
            {units.map((u) => (
                <option key={u.unitId} value={u.unitId}>
                    {u.unitName.toUpperCase()}
                    {u.isBaseUnit ? ' (base)' : ''}
                </option>
            ))}
        </select>
    );
}
