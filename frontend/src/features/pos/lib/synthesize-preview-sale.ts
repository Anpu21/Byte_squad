import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type {
    ISale,
    ISaleItem,
    ISaleItemUnitSnapshot,
} from '@/types';
import { TransactionType, DiscountType, PaymentMethod } from '@/constants/enums';
import { applyCartDiscount } from '@/features/pos/components/invoice-total/pos-invoice-total.helpers';

interface IPreviewSaleArgs {
    cart: readonly ICartItem[];
    invoiceNumber: string;
    cartDiscountPercentage: number;
}

/**
 * Sentinel id prefix the synthesizer stamps onto every fake id (sale +
 * each item). Lets the cashier-side live preview render through the
 * existing `PosBillTemplate` without any consumer mistaking the
 * synthesized object for a persisted Sale: anyone inspecting the
 * rendered DOM (or a snapshot test) can grep for `preview-` and see at
 * a glance that this object never round-tripped through the backend.
 */
const PREVIEW_ID_PREFIX = 'preview-';

/**
 * Builds the `unit` eager-load snapshot for non-base lines. Returns
 * `null` when the cart row is in the product's base unit (`unitId`
 * absent) so the bill template falls back to `product.baseUnit` for
 * the printed label, matching how a real persisted sale renders.
 */
function buildUnitSnapshot(row: ICartItem): ISaleItemUnitSnapshot | null {
    if (!row.unitId) return null;
    return {
        id: row.unitId,
        name: row.unitName,
        conversionToBase: row.conversionFactor,
    };
}

/**
 * Maps a single in-progress cart row into the `ISaleItem` shape the
 * bill template expects. Line-level numerics (`lineSubtotal`,
 * `lineDiscountAmount`, `lineTaxAmount`, `lineTotal`, `baseUnitQty`)
 * are passed through verbatim from the cart so the preview shows the
 * exact same per-line math `usePosCart` already computed via
 * `computeLine` — no double-rounding, no drift.
 */
function toSaleItem(row: ICartItem, index: number): ISaleItem {
    return {
        id: `${PREVIEW_ID_PREFIX}item-${index}`,
        saleId: `${PREVIEW_ID_PREFIX}sale`,
        productId: row.productId,
        quantity: row.quantity,
        baseUnitQty: row.baseUnitQty,
        unitId: row.unitId,
        unitPrice: row.unitPrice,
        discountAmount: row.lineDiscountAmount,
        discountType:
            row.discountPercentage > 0 ? DiscountType.PERCENTAGE : DiscountType.NONE,
        lineTotal: row.lineTotal,
        priceLevelUsed: 'Retail',
        lineDiscountPercentage: row.discountPercentage,
        lineSubtotal: row.lineSubtotal,
        lineTaxRate: row.taxRate,
        lineTaxAmount: row.lineTaxAmount,
        free: row.free,
        locationTakenFrom: 'Shop',
        status: 'Active',
        product: {
            id: row.productId,
            name: row.productName,
            baseUnit: row.baseUnit,
        },
        unit: buildUnitSnapshot(row),
    };
}

/**
 * Builds a `Sale`-shaped object from the in-progress cart so the
 * cashier-side live preview can render the existing
 * `PosBillTemplate` unchanged. Synthetic ids start with `preview-`
 * so anyone inspecting the rendered DOM or a snapshot knows the
 * receipt has not been billed.
 *
 * The cart-discount math mirrors `applyCartDiscount` from
 * `pos-invoice-total.helpers` so the preview total matches what the
 * cashier will actually charge after checkout. Per-line numerics are
 * trusted from the cart — the synthesizer does not re-run
 * `computeLine`, which means rounding stays consistent with what the
 * cashier already sees in the item table.
 */
export function synthesizePreviewSale({
    cart,
    invoiceNumber,
    cartDiscountPercentage,
}: IPreviewSaleArgs): ISale {
    const items = cart.map(toSaleItem);

    const itemsSubtotal = items.reduce((sum, it) => sum + it.lineSubtotal, 0);
    const totalLineDiscount = items.reduce(
        (sum, it) => sum + it.discountAmount,
        0,
    );
    const totalTax = items.reduce((sum, it) => sum + it.lineTaxAmount, 0);
    const { cartDiscountAmount, cartTotal } = applyCartDiscount(
        itemsSubtotal,
        totalLineDiscount,
        totalTax,
        cartDiscountPercentage,
    );

    return {
        id: `${PREVIEW_ID_PREFIX}sale`,
        transactionNumber: `${PREVIEW_ID_PREFIX}txn`,
        invoiceNumber,
        billPrinted: false,
        billPrintCount: 0,
        firstPrintDate: null,
        lastPrintDate: null,
        branchId: `${PREVIEW_ID_PREFIX}branch`,
        cashierId: `${PREVIEW_ID_PREFIX}cashier`,
        type: TransactionType.SALE,
        subtotal: itemsSubtotal,
        discountAmount: cartDiscountAmount,
        discountType:
            cartDiscountPercentage > 0
                ? DiscountType.PERCENTAGE
                : DiscountType.NONE,
        taxAmount: totalTax,
        total: cartTotal,
        paymentMethod: PaymentMethod.CASH,
        saleType: 'Retail',
        priceLevel: 'Retail',
        discountPercentage: cartDiscountPercentage,
        taxRate: 0,
        paidAmount: 0,
        balanceDue: cartTotal,
        paymentStatus: 'Unpaid',
        status: 'Active',
        location: 'Shop',
        customerUserId: null,
        voidedReason: null,
        voidedAt: null,
        voidedByUserId: null,
        items,
        customer: null,
        createdAt: new Date().toISOString(),
    };
}
