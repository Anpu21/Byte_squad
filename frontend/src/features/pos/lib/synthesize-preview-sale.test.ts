import { describe, it, expect } from 'vitest';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import { synthesizePreviewSale } from './synthesize-preview-sale';

/**
 * Build a fully-derived `ICartItem` for the synthesizer specs. The
 * caller passes whatever inputs matter for the test; the helper fills
 * in defaults that mirror what `usePosCart` would produce so the
 * synthesizer doesn't have to invent `lineSubtotal`/`lineTotal` on the
 * fly. `lineSubtotal`/`lineDiscountAmount`/`lineTaxAmount`/`lineTotal`
 * are passed through verbatim — the helper does not re-run the math.
 */
function buildCartItem(overrides: Partial<ICartItem> = {}): ICartItem {
    return {
        rowId: overrides.rowId ?? 'row-1',
        productId: overrides.productId ?? 'p-1',
        productCode: overrides.productCode ?? 'SKU-1',
        productName: overrides.productName ?? 'Whole-wheat bread',
        productType: overrides.productType ?? 'Goods',
        baseUnit: overrides.baseUnit ?? 'each',
        unitId: overrides.unitId ?? null,
        unitName: overrides.unitName ?? 'each',
        unitPrice: overrides.unitPrice ?? 50,
        conversionFactor: overrides.conversionFactor ?? 1,
        quantity: overrides.quantity ?? 2,
        free: overrides.free ?? 0,
        discountPercentage: overrides.discountPercentage ?? 0,
        taxRate: overrides.taxRate ?? 0,
        discountAllowed: overrides.discountAllowed ?? true,
        lineSubtotal: overrides.lineSubtotal ?? 100,
        lineDiscountAmount: overrides.lineDiscountAmount ?? 0,
        lineTaxAmount: overrides.lineTaxAmount ?? 0,
        lineTotal: overrides.lineTotal ?? 100,
        baseUnitQty: overrides.baseUnitQty ?? 2,
    };
}

describe('synthesizePreviewSale', () => {
    it('returns an empty-items Sale with zero totals when the cart is empty', () => {
        const sale = synthesizePreviewSale({
            cart: [],
            invoiceNumber: 'INV-2026-000123',
            cartDiscountPercentage: 0,
        });
        expect(sale.items).toEqual([]);
        expect(sale.invoiceNumber).toBe('INV-2026-000123');
        expect(sale.subtotal).toBe(0);
        expect(sale.total).toBe(0);
        expect(sale.discountAmount).toBe(0);
        expect(sale.taxAmount).toBe(0);
    });

    it('maps a single cart row into a Sale with matching subtotal and total when discount is 0', () => {
        const cart = [
            buildCartItem({
                quantity: 3,
                unitPrice: 100,
                lineSubtotal: 300,
                lineTotal: 300,
            }),
        ];
        const sale = synthesizePreviewSale({
            cart,
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 0,
        });
        expect(sale.items).toHaveLength(1);
        const item = sale.items?.[0];
        expect(item?.quantity).toBe(3);
        expect(item?.unitPrice).toBe(100);
        expect(item?.lineTotal).toBe(300);
        expect(sale.subtotal).toBe(300);
        expect(sale.total).toBe(300);
    });

    it('sums multiple line subtotals and keeps total = subtotal when cart discount is 0', () => {
        const cart = [
            buildCartItem({
                rowId: 'row-1',
                productId: 'p-1',
                lineSubtotal: 90, // 10% line discount already applied
                lineDiscountAmount: 10,
                lineTotal: 90,
            }),
            buildCartItem({
                rowId: 'row-2',
                productId: 'p-2',
                lineSubtotal: 200,
                lineDiscountAmount: 0,
                lineTotal: 200,
            }),
        ];
        const sale = synthesizePreviewSale({
            cart,
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 0,
        });
        expect(sale.subtotal).toBe(290);
        expect(sale.total).toBe(290);
        expect(sale.discountAmount).toBe(0);
    });

    it('applies a cart-level percentage discount on top of the line subtotals', () => {
        // 1000 subtotal × 10% cart discount → cart discount 100, total 900.
        const cart = [
            buildCartItem({
                rowId: 'row-1',
                productId: 'p-1',
                lineSubtotal: 1000,
                lineDiscountAmount: 0,
                lineTaxAmount: 0,
                lineTotal: 1000,
            }),
        ];
        const sale = synthesizePreviewSale({
            cart,
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 10,
        });
        expect(sale.subtotal).toBe(1000);
        expect(sale.discountAmount).toBe(100);
        expect(sale.total).toBe(900);
    });

    it('snapshots the picked sellable unit so the preview can render "250 g × LKR 0.20/g"', () => {
        const cart = [
            buildCartItem({
                productId: 'p-rice',
                productName: 'Basmati rice',
                baseUnit: 'kg',
                unitId: 'u-g',
                unitName: 'g',
                conversionFactor: 0.001,
                quantity: 250,
                unitPrice: 200,
                lineSubtotal: 50,
                lineTotal: 50,
                baseUnitQty: 0.25,
            }),
        ];
        const sale = synthesizePreviewSale({
            cart,
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 0,
        });
        const item = sale.items?.[0];
        expect(item?.unitId).toBe('u-g');
        expect(item?.unit).toEqual({
            id: 'u-g',
            name: 'g',
            conversionToBase: 0.001,
        });
        expect(item?.product?.baseUnit).toBe('kg');
        expect(item?.baseUnitQty).toBe(0.25);
    });

    it('passes the supplied invoice number through to the synthesized sale', () => {
        const sale = synthesizePreviewSale({
            cart: [],
            invoiceNumber: 'INV-2099-999999',
            cartDiscountPercentage: 0,
        });
        expect(sale.invoiceNumber).toBe('INV-2099-999999');
    });

    it('stamps synthetic ids that start with "preview-" so the DOM advertises this is not a persisted sale', () => {
        const cart = [
            buildCartItem({ rowId: 'row-a', productId: 'p-1' }),
            buildCartItem({ rowId: 'row-b', productId: 'p-2' }),
        ];
        const sale = synthesizePreviewSale({
            cart,
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 0,
        });
        expect(sale.id.startsWith('preview-')).toBe(true);
        expect(sale.items?.[0]?.id.startsWith('preview-')).toBe(true);
        expect(sale.items?.[1]?.id.startsWith('preview-')).toBe(true);
        // Distinct per row so React keys stay unique.
        expect(sale.items?.[0]?.id).not.toBe(sale.items?.[1]?.id);
    });

    it('leaves payment unset and marks the synthesized sale as never-printed', () => {
        const sale = synthesizePreviewSale({
            cart: [],
            invoiceNumber: 'INV-PREVIEW',
            cartDiscountPercentage: 0,
        });
        // No payment yet — the cashier hasn't tendered.
        expect(sale.payment).toBeUndefined();
        // The preview is, by definition, not a printed receipt.
        expect(sale.billPrinted).toBe(false);
        expect(sale.billPrintCount).toBe(0);
    });
});
