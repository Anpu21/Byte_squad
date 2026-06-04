import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionType, DiscountType, PaymentMethod } from '@/constants/enums';
import { PosBillPreviewModal } from '../PosBillPreviewModal';
import type { ISale } from '@/types';
import { posService } from '@/services/pos.service';

vi.mock('@/services/pos.service', () => ({
    posService: {
        markPrinted: vi.fn(),
    },
}));

const markPrintedMock = vi.mocked(posService.markPrinted);

function makeSale(): ISale {
    return {
        id: 's1',
        transactionNumber: 'TX-1',
        invoiceNumber: 'INV-2026-000099',
        billPrinted: false,
        billPrintCount: 0,
        firstPrintDate: null,
        lastPrintDate: null,
        branchId: 'b1',
        cashierId: 'c1',
        type: TransactionType.SALE,
        subtotal: 250,
        discountAmount: 0,
        discountType: DiscountType.NONE,
        taxAmount: 0,
        total: 250,
        paymentMethod: PaymentMethod.CASH,
        saleType: 'Retail',
        priceLevel: 'Retail',
        discountPercentage: 0,
        taxRate: 0,
        paidAmount: 250,
        balanceDue: 0,
        paymentStatus: 'Paid',
        status: 'Active',
        location: 'Shop',
        customerUserId: null,
        loyaltyCustomerId: null,
        voidedReason: null,
        voidedAt: null,
        voidedByUserId: null,
        items: [
            {
                id: 'si-1',
                saleId: 's1',
                productId: 'p1',
                quantity: 1,
                baseUnitQty: 1,
                unitId: null,
                unitPrice: 250,
                discountAmount: 0,
                discountType: DiscountType.NONE,
                lineTotal: 250,
                priceLevelUsed: 'Retail',
                lineDiscountPercentage: 0,
                lineSubtotal: 250,
                lineTaxRate: 0,
                lineTaxAmount: 0,
                free: 0,
                locationTakenFrom: 'Shop',
                status: 'Active',
                product: { id: 'p1', name: 'Milk 1L' },
            },
        ],
        customer: null,
        createdAt: '2026-05-23T09:00:00.000Z',
    };
}

function renderModal(overrides: { sale?: ISale | null; isOpen?: boolean } = {}) {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
            mutations: { retry: false },
        },
    });
    const onClose = vi.fn();
    render(
        <QueryClientProvider client={client}>
            <PosBillPreviewModal
                isOpen={overrides.isOpen ?? true}
                onClose={onClose}
                sale={overrides.sale === undefined ? makeSale() : overrides.sale}
                businessName="LedgerPro Mart"
            />
        </QueryClientProvider>,
    );
    return { onClose };
}

describe('PosBillPreviewModal', () => {
    beforeEach(() => {
        markPrintedMock.mockReset();
        vi.spyOn(window, 'print').mockImplementation(() => undefined);
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
            (cb: FrameRequestCallback) => {
                cb(0);
                return 1;
            },
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the bill template for the supplied sale', () => {
        renderModal();
        expect(screen.getByText('LedgerPro Mart')).toBeInTheDocument();
        expect(screen.getByText('INV-2026-000099')).toBeInTheDocument();
        expect(screen.getByText('Milk 1L')).toBeInTheDocument();
    });

    it('shows the empty-state copy when sale is null', () => {
        renderModal({ sale: null });
        expect(
            screen.getByText('Select a sale to preview its bill.'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Milk 1L')).not.toBeInTheDocument();
    });

    it('fires the print pipeline when "Print receipt" is clicked', async () => {
        markPrintedMock.mockResolvedValueOnce({
            ...makeSale(),
            billPrinted: true,
            billPrintCount: 1,
        });
        renderModal();
        const printButton = screen.getByRole('button', {
            name: /Print receipt/i,
        });
        // Click kicks off the imperative print; immediately dispatch
        // afterprint so the hook's promise resolves inside the test.
        await userEvent.click(printButton);
        act(() => {
            window.dispatchEvent(new Event('afterprint'));
        });
        await waitFor(() => expect(window.print).toHaveBeenCalled());
        await waitFor(() =>
            expect(markPrintedMock).toHaveBeenCalledWith('s1'),
        );
    });

    it('invokes onClose when the Close button is clicked', async () => {
        const { onClose } = renderModal();
        await userEvent.click(screen.getByRole('button', { name: /^Close$/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('portals the print host as a direct child of document.body while printing', async () => {
        // Do not resolve markPrinted; the print host should remain mounted
        // on document.body while the print flow is in progress.
        markPrintedMock.mockImplementationOnce(
            () =>
                new Promise(() => {
                    /* never resolves */
                }),
        );
        renderModal();
        const printButton = screen.getByRole('button', {
            name: /Print receipt/i,
        });
        // Click triggers print; we deliberately do NOT dispatch afterprint
        // here so `printingSale` stays set and the portal remains in DOM.
        await userEvent.click(printButton);
        // The print host must be portalled directly under document.body
        // so the @media print rules (`body > [data-pos-print-area]`) can
        // un-hide it. If the host nested inside `#root`, the body-level
        // selector would not match and printing would yield a blank page.
        await waitFor(() => {
            const directBodyChildren = Array.from(
                document.body.children,
            ).filter((el) => el.hasAttribute('data-pos-print-area'));
            expect(directBodyChildren.length).toBeGreaterThan(0);
        });
    });
});
