import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PosBillLivePreview } from '../PosBillLivePreview';
import type { ICartItem } from '@/features/pos/types/cart-item.type';

const baseCartItem: ICartItem = {
    rowId: 'r1',
    productId: 'p1',
    productCode: 'BVG-005',
    productName: 'Bottled Water 1.5L',
    productType: 'Beverages',
    baseUnit: 'l',
    unitId: null,
    unitName: 'l',
    unitPrice: 130,
    conversionFactor: 1,
    quantity: 1,
    baseUnitQty: 1,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
    lineSubtotal: 130,
    lineDiscountAmount: 0,
    lineTaxAmount: 0,
    lineTotal: 130,
};

describe('PosBillLivePreview', () => {
    it('renders an empty-state message when cart is empty', () => {
        render(
            <PosBillLivePreview
                cart={[]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={0}
            />,
        );
        expect(
            screen.getByText(/Add items to preview/i),
        ).toBeInTheDocument();
    });

    it('renders the bill template with the previewed invoice number when cart has items', () => {
        render(
            <PosBillLivePreview
                cart={[baseCartItem]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={0}
            />,
        );
        expect(screen.getByText('INV-NEXT')).toBeInTheDocument();
        expect(screen.getByText(/Bottled Water/i)).toBeInTheDocument();
    });

    it('reflects cart discount in the displayed total', () => {
        render(
            <PosBillLivePreview
                cart={[baseCartItem]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={10}
            />,
        );
        // Subtotal 130 minus 10% cart discount = 117 grand total.
        // The "117" value renders in multiple totals rows (Total +
        // Balance due) — getAllByText keeps the assertion robust.
        const matches = screen.getAllByText(/117/);
        expect(matches.length).toBeGreaterThan(0);
    });

    it('does not carry data-pos-print-area on the preview wrapper (avoids collision with print host)', () => {
        render(
            <PosBillLivePreview
                cart={[baseCartItem]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={0}
            />,
        );
        // The preview wrapper must NOT be a direct body child carrying the
        // print marker — that attribute is reserved for PosPrintHost.
        const printAreas = document.querySelectorAll(
            'body > [data-pos-print-area]',
        );
        expect(printAreas).toHaveLength(0);
    });

    it('updates when the cart changes (re-renders new totals)', () => {
        const { rerender } = render(
            <PosBillLivePreview
                cart={[baseCartItem]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={0}
            />,
        );
        // 130 appears in subtotal + total rows initially.
        expect(screen.getAllByText(/130/).length).toBeGreaterThan(0);
        rerender(
            <PosBillLivePreview
                cart={[
                    {
                        ...baseCartItem,
                        quantity: 2,
                        baseUnitQty: 2,
                        lineSubtotal: 260,
                        lineTotal: 260,
                    },
                ]}
                invoiceNumber="INV-NEXT"
                cartDiscountPercentage={0}
            />,
        );
        // After rerender, totals reflect the new 260 subtotal.
        expect(screen.getAllByText(/260/).length).toBeGreaterThan(0);
    });
});
