/**
 * Pure cart-line math. Mirrors the backend `LineTotalService` so the
 * cashier UI shows the same numbers the server will record. Two helpers:
 *
 * - `round2` keeps currency values at two decimals.
 * - `round3` keeps base-unit quantities at three decimals so grams-from-kg
 *   conversions (1000 × 0.001) land exactly on 1 instead of 0.999…7.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

export interface ILineMath {
    chargedQty: number;
    baseUnitQty: number;
    lineSubtotal: number;
    lineDiscountAmount: number;
    lineTaxAmount: number;
    lineTotal: number;
}

export interface IComputeLineInput {
    quantity: number;
    free: number;
    unitPrice: number;
    discountPercentage: number;
    taxRate: number;
    conversionFactor: number;
}

/**
 * Computes the six derived numbers for a cart line.
 *
 * `unitPrice` is always the price per BASE unit (e.g. Rs 200 for a kg of
 * carrots), regardless of which sellable unit the cashier picked. To
 * convert into the picked unit's price we scale by `conversionFactor`:
 *
 *   pickedUnitPrice = unitPrice × conversionFactor
 *
 * For a kg-stocked carrot priced at Rs 200/kg sold in grams
 * (`conversionFactor = 0.001`), this gives Rs 0.2/g, so 250g = Rs 50.
 * Discrete or base-unit lines have `conversionFactor = 1` and the formula
 * collapses to the original `chargedQty × unitPrice` shape.
 *
 * Order of operations:
 *   1. `chargedQty = max(0, quantity - free)` — free units do not contribute
 *      to subtotal but still count toward inventory deduction.
 *   2. `baseUnitQty = quantity × conversionFactor` — the canonical amount the
 *      backend will deduct from stock.
 *   3. `lineSubtotal = chargedQty × unitPrice × conversionFactor × (1 - discount/100)`.
 *   4. Discount is computed against the un-discounted base (so it survives
 *      a tax/discount swap on the UI).
 *   5. Tax is applied AFTER discount.
 */
export function computeLine(input: IComputeLineInput): ILineMath {
    const chargedQty = Math.max(0, input.quantity - input.free);
    const baseUnitQty = round3(input.quantity * input.conversionFactor);
    const grossPerUnit = input.unitPrice * input.conversionFactor;
    const lineSubtotal = round2(
        chargedQty * grossPerUnit * (1 - input.discountPercentage / 100),
    );
    const lineDiscountAmount = round2(
        chargedQty * grossPerUnit * (input.discountPercentage / 100),
    );
    const lineTaxAmount = round2(lineSubtotal * (input.taxRate / 100));
    const lineTotal = round2(lineSubtotal + lineTaxAmount);
    return {
        chargedQty,
        baseUnitQty,
        lineSubtotal,
        lineDiscountAmount,
        lineTaxAmount,
        lineTotal,
    };
}
