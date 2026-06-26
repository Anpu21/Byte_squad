import { useState } from 'react';
import type { TBaseUnitFe } from '../lib/sellable-units';

/**
 * Owns the per-price unit selectors next to cost/selling price inputs.
 * Both fields track which row in `units` the entered price is denominated
 * in. They default to the current base unit, and the composer in
 * `useProductFormState` resets them whenever the base unit changes so that
 * flipping kg to l cannot silently leave the price unit on an old custom row.
 *
 * Each field also carries a `…PriceQty` basis — the quantity of the selected
 * unit the entered price covers (e.g. "Rs 200 for 0.5 kg"). It defaults to
 * "1" and is divided out on submit so the stored price stays per-1-base-unit.
 */
export interface ProductPriceUnitsState {
    costPriceUnit: string;
    setCostPriceUnit: (next: string) => void;
    costPriceQty: string;
    setCostPriceQty: (next: string) => void;
    sellingPriceUnit: string;
    setSellingPriceUnit: (next: string) => void;
    sellingPriceQty: string;
    setSellingPriceQty: (next: string) => void;
    /**
     * Reset both price-unit fields to the given base unit name and both
     * basis quantities back to "1". Called by the composer whenever the base
     * unit itself changes.
     */
    resetPriceUnitsTo: (next: TBaseUnitFe) => void;
}

export function useProductPriceUnits(
    initialBaseUnit: TBaseUnitFe,
): ProductPriceUnitsState {
    const [costPriceUnit, setCostPriceUnit] = useState<string>(initialBaseUnit);
    const [costPriceQty, setCostPriceQty] = useState<string>('1');
    const [sellingPriceUnit, setSellingPriceUnit] =
        useState<string>(initialBaseUnit);
    const [sellingPriceQty, setSellingPriceQty] = useState<string>('1');

    function resetPriceUnitsTo(next: TBaseUnitFe) {
        setCostPriceUnit(next);
        setSellingPriceUnit(next);
        setCostPriceQty('1');
        setSellingPriceQty('1');
    }

    return {
        costPriceUnit,
        setCostPriceUnit,
        costPriceQty,
        setCostPriceQty,
        sellingPriceUnit,
        setSellingPriceUnit,
        sellingPriceQty,
        setSellingPriceQty,
        resetPriceUnitsTo,
    };
}
