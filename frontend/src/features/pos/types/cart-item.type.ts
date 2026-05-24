/**
 * One row of the cashier cart, kept entirely on the frontend until checkout.
 * Mirrors the Shanel itemTable row: identity (productId/code/name/type),
 * the picked sellable unit (unitId / unitName / conversionFactor) plus
 * editable numerics (quantity, free, discountPercentage, taxRate) and the
 * derived line totals recomputed via `computeLine` on every change.
 *
 * `rowId` is a UI-only UUID used as the React key. The price level chosen
 * for the row is captured at add time via `unitPrice` (no `priceLevel`
 * field on the row itself — the cart-level toggle lives on `PosPage` and
 * is sent server-side per item as `priceLevelUsed`).
 */
export interface ICartItem {
    rowId: string;
    productId: string;
    productCode: string;
    productName: string;
    productType: string;
    baseUnit: string;
    unitId: string | null;
    unitName: string;
    unitPrice: number;
    conversionFactor: number;
    quantity: number;
    free: number;
    /** 0-100. Ignored if `discountAllowed` is false. */
    discountPercentage: number;
    /** 0-100. */
    taxRate: number;
    discountAllowed: boolean;
    // Derived — recomputed by `computeLine` on every change:
    lineSubtotal: number;
    lineDiscountAmount: number;
    lineTaxAmount: number;
    lineTotal: number;
    baseUnitQty: number;
}
