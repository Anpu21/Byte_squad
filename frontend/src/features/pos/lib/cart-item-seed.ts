import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { ISearchProductRow } from '@/types';

type AddItemSeed = Omit<
    ICartItem,
    | 'rowId'
    | 'lineSubtotal'
    | 'lineDiscountAmount'
    | 'lineTaxAmount'
    | 'lineTotal'
    | 'baseUnitQty'
>;

/**
 * Map a Shanel `ISearchProductRow` onto the cart-row seed shape
 * `usePosCart.addItem` expects. The Retail/Wholesale toggle was removed —
 * every staged line uses the product's retail price; the cashier can still
 * override unit / qty / discount per row afterwards.
 *
 * `opts.quantity` seeds the line quantity — e.g. a weight decoded from a scale
 * barcode. It only applies to measure units (kg/l); a fixed-count `unit`
 * product ignores it and falls back to a single unit.
 */
export function toCartItemSeed(
    row: ISearchProductRow,
    opts?: { quantity?: number },
): AddItemSeed {
    const matchedUnit = row.matchedUnit;
    const quantity =
        opts?.quantity != null && row.baseUnit !== 'unit' ? opts.quantity : 1;
    return {
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        productType: row.productType,
        baseUnit: row.baseUnit,
        unitId: matchedUnit?.unitId ?? null,
        unitName: matchedUnit?.unitName ?? row.baseUnit,
        unitPrice: matchedUnit?.sellingPrice ?? row.retailPrice,
        conversionFactor: matchedUnit?.conversionToBase ?? 1,
        quantity,
        free: 0,
        discountPercentage: 0,
        taxRate: row.taxRate,
        discountAllowed: row.discountAllowed,
    };
}
