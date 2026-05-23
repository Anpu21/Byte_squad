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
                cashierName="Asha Cashier"
            />,
        );

        expect(screen.getByText('LedgerPro Mart')).toBeInTheDocument();
        expect(
            screen.getByText('12 Marine Drive, Colombo'),
        ).toBeInTheDocument();
        expect(screen.getByText('INV-2026-000001')).toBeInTheDocument();
        expect(screen.getByText(/Cashier: Asha Cashier/)).toBeInTheDocument();
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

    it('shows the reprint counter when billPrintCount > 0', () => {
        const sale = buildSale({ billPrintCount: 3 });
        render(<PosBillTemplate sale={sale} />);
        expect(screen.getByText('Reprint #3')).toBeInTheDocument();
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
