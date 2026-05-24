import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { ISearchProductRow, TPriceLevel } from '@/types';

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
 * `usePosCart.addItem` expects. Picks the price level at the moment of
 * staging so the cart row carries the resolved unit price; the cashier
 * can override the unit / qty / discount per row afterwards.
 */
export function toCartItemSeed(
    row: ISearchProductRow,
    priceLevel: TPriceLevel,
): AddItemSeed {
    const unitPrice =
        priceLevel === 'Retail' ? row.retailPrice : row.wholesalePrice;
    return {
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        productType: row.productType,
        baseUnit: row.baseUnit,
        unitId: null,
        unitName: row.baseUnit,
        unitPrice,
        conversionFactor: 1,
        quantity: 1,
        free: 0,
        discountPercentage: 0,
        taxRate: row.taxRate,
        discountAllowed: row.discountAllowed,
    };
}
