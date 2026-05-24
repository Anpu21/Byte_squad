import { TransactionType, DiscountType, PaymentMethod } from '@/constants/enums';
import type { ISale } from '@/types';

/**
 * Minimal Sale fixture used across mutation specs. Mirrors the shape the
 * backend returns from /pos/sales endpoints.
 */
export const saleFixture: ISale = {
    id: 's1',
    transactionNumber: 'TX-1',
    invoiceNumber: 'INV-1',
    billPrinted: false,
    billPrintCount: 0,
    firstPrintDate: null,
    lastPrintDate: null,
    branchId: 'b1',
    cashierId: 'c1',
    type: TransactionType.SALE,
    subtotal: 100,
    discountAmount: 0,
    discountType: DiscountType.NONE,
    taxAmount: 0,
    total: 100,
    paymentMethod: PaymentMethod.CASH,
    saleType: 'Retail',
    priceLevel: 'Retail',
    discountPercentage: 0,
    taxRate: 0,
    paidAmount: 100,
    balanceDue: 0,
    paymentStatus: 'Paid',
    status: 'Active',
    location: 'Shop',
    customerUserId: null,
    voidedReason: null,
    voidedAt: null,
    voidedByUserId: null,
    createdAt: new Date().toISOString(),
};
