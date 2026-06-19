import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { TransactionType, DiscountType, PaymentMethod } from '@/constants/enums';
import type { ISale, ISaleItem, ISalePayment } from '@/types';
import { PosBillTemplate } from '../PosBillTemplate';

const fixedCreatedAt = '2026-05-23T14:32:00.000Z';

function buildSaleItem(overrides: Partial<ISaleItem> = {}): ISaleItem {
    return {
        id: overrides.id ?? 'si-1',
        saleId: 's1',
        productId: 'p1',
        quantity: 2,
        baseUnitQty: 2,
        unitId: null,
        unitPrice: 50,
        discountAmount: 0,
        discountType: DiscountType.NONE,
        lineTotal: 100,
        priceLevelUsed: 'Retail',
        lineDiscountPercentage: 0,
        lineSubtotal: 100,
        lineTaxRate: 0,
        lineTaxAmount: 0,
        free: 0,
        locationTakenFrom: 'Shop',
        status: 'Active',
        product: { id: 'p1', name: 'Whole-wheat bread' },
        ...overrides,
    };
}

function buildPayment(overrides: Partial<ISalePayment> = {}): ISalePayment {
    return {
        id: 'pay-1',
        saleId: 's1',
        receiptNo: 'RCPT-1',
        paymentMethod: 'Cash',
        paymentAmount: 100,
        invoiceTotal: 100,
        cashTendered: 200,
        cashAmount: 100,
        cashChange: 100,
        chequeAmount: 0,
        bankTransferAmount: 0,
        creditAmount: 0,
        loyaltyAmount: 0,
        keepBalance: false,
        chequeNo: null,
        chequeDate: null,
        chequeBank: null,
        chequeBranch: null,
        chequeDeliveredBy: null,
        chequeRef: null,
        bankRef: null,
        status: 'Active',
        createdAt: fixedCreatedAt,
        updatedAt: fixedCreatedAt,
        ...overrides,
    };
}

function buildSale(overrides: Partial<ISale> = {}): ISale {
    return {
        id: 's1',
        transactionNumber: 'TX-1',
        invoiceNumber: 'INV-2026-000001',
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
        loyaltyCustomerId: null,
        voidedReason: null,
        voidedAt: null,
        voidedByUserId: null,
        items: [buildSaleItem()],
        payment: buildPayment(),
        customer: null,
        createdAt: fixedCreatedAt,
        ...overrides,
    };
}

describe('PosBillTemplate', () => {
    it('renders header, item, totals, and footer for a fully populated sale', () => {
        const sale = buildSale({
            taxAmount: 10,
            discountAmount: 5,
            items: [
                buildSaleItem({
                    lineDiscountPercentage: 10,
                    discountAmount: 5,
                    lineTaxRate: 8,
                    lineTaxAmount: 4,
                    free: 1,
                }),
            ],
        });
        render(
            <PosBillTemplate
                sale={sale}
                businessName="LedgerPro Mart"
                businessAddress="12 Marine Drive, Colombo"
            />,
        );

        expect(screen.getByText('LedgerPro Mart')).toBeInTheDocument();
        expect(
            screen.getByText('12 Marine Drive, Colombo'),
        ).toBeInTheDocument();
        expect(screen.getByText('INV-2026-000001')).toBeInTheDocument();
        expect(screen.getByText(/Walk-in customer/)).toBeInTheDocument();
        expect(screen.getByText('Whole-wheat bread')).toBeInTheDocument();
        expect(screen.getByText(/−10% disc/)).toBeInTheDocument();
        expect(screen.getByText(/\+Tax 8%/)).toBeInTheDocument();
        expect(screen.getByText(/Free: 1/)).toBeInTheDocument();
        expect(screen.getByText('Subtotal')).toBeInTheDocument();
        expect(screen.getByText('Cart discount')).toBeInTheDocument();
        expect(screen.getByText('Tax')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Change')).toBeInTheDocument();
        expect(
            screen.getByText('Thank you for shopping!'),
        ).toBeInTheDocument();
    });

    it('prints the picked unit name alongside quantity and selected-unit price', () => {
        const sale = buildSale({
            items: [
                buildSaleItem({
                    quantity: 1,
                    baseUnitQty: 12,
                    unitId: 'u-pack',
                    unitPrice: 650,
                    lineTotal: 650,
                    lineSubtotal: 650,
                    unit: {
                        id: 'u-pack',
                        name: '12-PACK',
                        conversionToBase: 12,
                    },
                    product: {
                        id: 'p1',
                        name: 'Eggs',
                        baseUnit: 'unit',
                    },
                }),
            ],
            subtotal: 650,
            total: 650,
        });
        render(<PosBillTemplate sale={sale} />);
        expect(
            screen.getByText((text) =>
                /1 12-PACK × LKR\s*650\.00\/12-PACK/.test(text),
            ),
        ).toBeInTheDocument();
    });

    it('falls back to the product base unit when the picked unit is missing', () => {
        // Backward-compatible: older sales rows without `unit` eager-loaded
        // still read "1 kg × LKR 200.00/kg" using `product.baseUnit`.
        const sale = buildSale({
            items: [
                buildSaleItem({
                    quantity: 1,
                    baseUnitQty: 1,
                    unitId: null,
                    unitPrice: 200,
                    lineTotal: 200,
                    lineSubtotal: 200,
                    unit: null,
                    product: {
                        id: 'p1',
                        name: 'Basmati rice',
                        baseUnit: 'kg',
                    },
                }),
            ],
            subtotal: 200,
            total: 200,
        });
        render(<PosBillTemplate sale={sale} />);
        expect(
            screen.getByText((text) => /1 kg × LKR\s*200\.00\/kg/.test(text)),
        ).toBeInTheDocument();
    });

    it('omits the unit suffix entirely when neither picked nor base unit is known', () => {
        // Pre-existing sale (Phase 1 or earlier seed) with no unit data —
        // renderer must not synthesize a label and must not crash.
        const sale = buildSale({
            items: [
                buildSaleItem({
                    quantity: 2,
                    baseUnitQty: 2,
                    unitId: null,
                    unitPrice: 50,
                    lineTotal: 100,
                    lineSubtotal: 100,
                    unit: null,
                    product: { id: 'p1', name: 'Loaf of bread' },
                }),
            ],
        });
        render(<PosBillTemplate sale={sale} />);
        // No slash means no "/unit" suffix was appended.
        expect(
            screen.getByText((text) => /^2 × LKR\s*50\.00$/.test(text)),
        ).toBeInTheDocument();
    });

    it('renders "Walk-in customer" when no customer relation is supplied', () => {
        const sale = buildSale({ customer: null, customerUserId: null });
        render(<PosBillTemplate sale={sale} />);
        expect(screen.getByText('Walk-in customer')).toBeInTheDocument();
    });

    it('renders the customer name when the customer relation is populated', () => {
        const sale = buildSale({
            customerUserId: 'u1',
            customer: { id: 'u1', firstName: 'Nimal', lastName: 'Perera' },
        });
        render(<PosBillTemplate sale={sale} />);
        expect(
            screen.getByText('Customer: Nimal Perera'),
        ).toBeInTheDocument();
    });

    it('shows the reprint counter when billPrintCount > 1', () => {
        const sale = buildSale({ billPrintCount: 3 });
        render(<PosBillTemplate sale={sale} />);
        expect(screen.getByText('Reprint #3')).toBeInTheDocument();
    });

    it('shows "Reprint #2" on the second printed copy', () => {
        const sale = buildSale({ billPrintCount: 2 });
        render(<PosBillTemplate sale={sale} />);
        expect(screen.getByText('Reprint #2')).toBeInTheDocument();
    });

    it('does not show the reprint counter on the first printed copy (count=1)', () => {
        const sale = buildSale({ billPrintCount: 1 });
        render(<PosBillTemplate sale={sale} />);
        expect(screen.queryByText(/^Reprint/)).not.toBeInTheDocument();
    });

    it('renders the "Points redeemed" money line from the persisted payment column', () => {
        const sale = buildSale({
            payment: buildPayment({
                loyaltyAmount: 200,
                cashAmount: 800,
                cashTendered: 800,
                cashChange: 0,
                paymentAmount: 800,
            }),
            total: 1000,
            subtotal: 1000,
            paidAmount: 1000,
        });
        render(<PosBillTemplate sale={sale} />);
        const redeemedRow = screen
            .getByText('Points redeemed')
            .closest('div') as HTMLElement;
        expect(within(redeemedRow).getByText(/−LKR\s*200/)).toBeInTheDocument();
    });

    it('renders the danger-toned balance-due row when the sale is short-paid', () => {
        const sale = buildSale({
            balanceDue: 50,
            paidAmount: 50,
            paymentStatus: 'Partially_Paid',
            payment: buildPayment({
                cashAmount: 50,
                cashChange: 0,
                cashTendered: 50,
                paymentAmount: 50,
            }),
        });
        render(<PosBillTemplate sale={sale} />);
        const balanceRow = screen
            .getByText('Balance due')
            .closest('div') as HTMLElement;
        expect(within(balanceRow).getByText(/LKR\s*50/)).toBeInTheDocument();
        expect(balanceRow.className).toContain('text-danger');
    });
});
