import { describe, expect, it } from 'vitest';
import { buildReceiptPdf } from '../build-receipt-pdf';
import type { ISale } from '@/types';

const SALE = {
    id: 'sale-1',
    invoiceNumber: 'INV-2026-000123',
    createdAt: '2026-06-20T10:00:00.000Z',
    customerUserId: 'cust-1',
    customer: { id: 'cust-1', firstName: 'Nadia', lastName: 'Perera' },
    subtotal: 1150,
    discountAmount: 50,
    taxAmount: 0,
    total: 1100,
    items: [
        {
            id: 'i1',
            product: { id: 'p1', name: 'Anchor Milk 1L', baseUnit: 'L' },
            unit: null,
            quantity: 2,
            unitPrice: 575,
            lineTotal: 1150,
        },
    ],
    loyalty: {
        ownerType: 'user',
        earned: 11,
        redeemed: 0,
        redeemValue: 0,
        newBalance: 120,
    },
} as unknown as ISale;

// base64 of the PDF magic bytes "%PDF-"
const PDF_BASE64_PREFIX = 'JVBER';

describe('buildReceiptPdf', () => {
    it('produces a non-empty base64 PDF for a sale', () => {
        const out = buildReceiptPdf(SALE, { name: 'Test Mart' });
        expect(out.length).toBeGreaterThan(100);
        expect(out.startsWith(PDF_BASE64_PREFIX)).toBe(true);
    });

    it('handles a walk-in sale with no items and no loyalty', () => {
        const out = buildReceiptPdf({
            ...SALE,
            customer: null,
            customerUserId: null,
            items: [],
            loyalty: undefined,
        } as unknown as ISale);
        expect(out.startsWith(PDF_BASE64_PREFIX)).toBe(true);
    });
});
