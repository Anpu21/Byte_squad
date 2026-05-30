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
 */
export function toCartItemSeed(row: ISearchProductRow): AddItemSeed {
    return {
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        productType: row.productType,
        baseUnit: row.baseUnit,
        unitId: null,
        unitName: row.baseUnit,
        unitPrice: row.retailPrice,
        conversionFactor: 1,
        quantity: 1,
        free: 0,
        discountPercentage: 0,
        taxRate: row.taxRate,
        discountAllowed: row.discountAllowed,
    };
}
