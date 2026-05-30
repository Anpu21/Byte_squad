import { useState } from 'react';
import type { TBaseUnitFe } from '../lib/sellable-units';

/**
 * Owns the per-price unit selectors next to cost/selling price inputs.
 * Both fields track which row in `units` the entered price is denominated
 * in. They default to the current base unit, and the composer in
 * `useProductFormState` resets them whenever the base unit changes so that
 * flipping kg → l cannot silently leave the price unit as `g`.
 */
export interface ProductPriceUnitsState {
    costPriceUnit: string;
    setCostPriceUnit: (next: string) => void;
    sellingPriceUnit: string;
    setSellingPriceUnit: (next: string) => void;
    /**
     * Reset both price-unit fields to the given base unit name. Called by
     * the composer whenever the base unit itself changes.
     */
    resetPriceUnitsTo: (next: TBaseUnitFe) => void;
}

export function useProductPriceUnits(
    initialBaseUnit: TBaseUnitFe,
): ProductPriceUnitsState {
    const [costPriceUnit, setCostPriceUnit] = useState<string>(initialBaseUnit);
    const [sellingPriceUnit, setSellingPriceUnit] =
        useState<string>(initialBaseUnit);

    function resetPriceUnitsTo(next: TBaseUnitFe) {
        setCostPriceUnit(next);
        setSellingPriceUnit(next);
    }

    return {
        costPriceUnit,
        setCostPriceUnit,
        sellingPriceUnit,
        setSellingPriceUnit,
        resetPriceUnitsTo,
    };
}
