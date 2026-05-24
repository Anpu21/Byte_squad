import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { PosPaymentForms } from '../PosPaymentForms';
import { usePosCreateSale } from '@/features/pos/hooks/usePosCreateSale';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type {
    ICreateSalePayload,
    ISale,
} from '@/types';

// Mock the createSale hook — the orchestrator's success path drives onSaleCreated
// from the resolved Sale, so the test owns both the mutate spy and the resolved
// value. Mocking at the hook level keeps the test independent from the service
// + react-query wiring (those layers are covered separately).
vi.mock('@/features/pos/hooks/usePosCreateSale', () => ({
    usePosCreateSale: vi.fn(),
}));

const usePosCreateSaleMock = vi.mocked(usePosCreateSale);

interface IMutateArgs {
    payload: ICreateSalePayload;
    idempotencyKey?: string;
}

function makeCartItem(overrides: Partial<ICartItem> = {}): ICartItem {
    return {
        rowId: 'row-1',
        productId: 'prod-1',
        productCode: 'P001',
        productName: 'Product 1',
        productType: 'GENERIC',
        baseUnit: 'pcs',
        unitId: 'unit-1',
        unitName: 'pcs',
        unitPrice: 100,
        conversionFactor: 1,
        quantity: 1,
        free: 0,
        discountPercentage: 0,
        taxRate: 0,
        discountAllowed: true,
        lineSubtotal: 100,
        lineDiscountAmount: 0,
        lineTaxAmount: 0,
        lineTotal: 100,
        baseUnitQty: 1,
        ...overrides,
    };
}

function makePersistedSale(overrides: Partial<ISale> = {}): ISale {
    return {
        id: 'sale-1',
        transactionNumber: 'TX-0001',
        invoiceNumber: 'INV-0001',
        billPrinted: false,
        billPrintCount: 0,
        firstPrintDate: null,
        lastPrintDate: null,
        branchId: 'branch-1',
        cashierId: 'cashier-1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        type: 'SALE' as any,
        subtotal: 100,
        discountAmount: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        discountType: 'PERCENTAGE' as any,
        taxAmount: 0,
        total: 100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        paymentMethod: 'CASH' as any,
        saleType: 'Retail',
        priceLevel: 'Retail',
        discountPercentage: 0,
        taxRate: 0,
        paidAmount: 100,
        balanceDue: 0,
        paymentStatus: 'Paid',
        status: 'Active',
        location: 'pos',
        customerUserId: null,
        voidedReason: null,
        voidedAt: null,
        voidedByUserId: null,
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

interface IRenderArgs {
    isOpen?: boolean;
    invoiceTotal?: number;
    cart?: ICartItem[];
    onSaleCreated?: (sale: ISale) => void;
    onClose?: () => void;
}

function renderModal(args: IRenderArgs = {}): {
    onSaleCreated: ReturnType<typeof vi.fn>;
    onClose: ReturnType<typeof vi.fn>;
} {
    const onSaleCreated = vi.fn(args.onSaleCreated);
    const onClose = vi.fn(args.onClose);
    const ui: ReactElement = (
        <PosPaymentForms
            isOpen={args.isOpen ?? true}
            onClose={onClose}
            invoiceTotal={args.invoiceTotal ?? 100}
            cart={args.cart ?? [makeCartItem()]}
            cartDiscountPercentage={0}
            onSaleCreated={onSaleCreated}
        />
    );
    render(ui);
    return { onSaleCreated, onClose };
}

describe('PosPaymentForms', () => {
    beforeEach(() => {
        usePosCreateSaleMock.mockReset();
    });

    it('charges a full-cash sale and forwards the persisted sale to onSaleCreated', async () => {
        const persisted = makePersistedSale();
        const mutateAsync = vi
            .fn<(args: IMutateArgs) => Promise<ISale>>()
            .mockResolvedValue(persisted);
        usePosCreateSaleMock.mockReturnValue({
            mutateAsync,
            isPending: false,
            error: null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { onSaleCreated, onClose } = renderModal({ invoiceTotal: 100 });

        // Initial state: cashTendered defaults to invoiceTotal — Charge ready to fire.
        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        expect(chargeButton).toBeEnabled();

        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledTimes(1);
        });

        const callArgs = mutateAsync.mock.calls[0]?.[0];
        expect(callArgs).toBeDefined();
        if (!callArgs) throw new Error('mutateAsync was not called');

        // Idempotency key was minted per-modal-session.
        expect(typeof callArgs.idempotencyKey).toBe('string');
        expect((callArgs.idempotencyKey ?? '').length).toBeGreaterThan(0);

        // Payload shape mirrors the cart + tender bag.
        expect(callArgs.payload.cartDiscountPercentage).toBe(0);
        expect(callArgs.payload.items).toHaveLength(1);
        expect(callArgs.payload.items[0]).toMatchObject({
            productId: 'prod-1',
            unitId: 'unit-1',
            quantity: 1,
            unitPrice: 100,
        });
        expect(callArgs.payload.payment).toMatchObject({
            paymentMethod: 'Cash',
            paymentAmount: 100,
            cashAmount: 100,
            cashTendered: 100,
        });
        // Customer / credit / keep-balance were removed from the cashier
        // workflow; the payload no longer carries any of them.
        const payloadBag = callArgs.payload as unknown as Record<
            string,
            unknown
        >;
        const paymentBag = callArgs.payload.payment as unknown as Record<
            string,
            unknown
        >;
        expect(payloadBag.customerUserId).toBeUndefined();
        expect(paymentBag.creditAmount).toBeUndefined();
        expect(paymentBag.keepBalance).toBeUndefined();

        // Success: onSaleCreated fires with the persisted Sale, then close.
        await waitFor(() => {
            expect(onSaleCreated).toHaveBeenCalledWith(persisted);
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('disables the Charge button when the cheque tender exceeds the invoice total', async () => {
        const mutateAsync = vi
            .fn<(args: IMutateArgs) => Promise<ISale>>()
            .mockResolvedValue(makePersistedSale());
        usePosCreateSaleMock.mockReturnValue({
            mutateAsync,
            isPending: false,
            error: null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        renderModal({ invoiceTotal: 100 });

        // Switch to Cheque method and tender Rs 150 against a Rs 100 invoice.
        const chequeRadio = screen.getByRole('radio', { name: /cheque/i });
        await userEvent.click(chequeRadio);

        const chequeAmountInput = screen.getByLabelText('Cheque amount');
        await userEvent.clear(chequeAmountInput);
        await userEvent.type(chequeAmountInput, '150');

        // The overpay warning surfaces inline and the Charge button stays
        // disabled — single-shop retail has no walk-in customer accounts
        // to park the surplus against, so the cashier must adjust the
        // tender to match the invoice.
        await waitFor(() => {
            expect(
                screen.getByText(/Tender exceeds the invoice total/i),
            ).toBeInTheDocument();
        });
        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        expect(chargeButton).toBeDisabled();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('shows the balance-due summary line and submits a partial-cash sale', async () => {
        const persisted = makePersistedSale({
            paidAmount: 60,
            balanceDue: 40,
            paymentStatus: 'Partially_Paid',
        });
        const mutateAsync = vi
            .fn<(args: IMutateArgs) => Promise<ISale>>()
            .mockResolvedValue(persisted);
        usePosCreateSaleMock.mockReturnValue({
            mutateAsync,
            isPending: false,
            error: null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        renderModal({ invoiceTotal: 100 });

        const cashInput = screen.getByLabelText('Cash tendered');
        await userEvent.clear(cashInput);
        await userEvent.type(cashInput, '60');

        // Summary surfaces the outstanding balance instead of change.
        const summary = screen.getByRole('region', { name: /tender summary/i });
        await waitFor(() => {
            const balanceCell = Array.from(summary.children).find((node) =>
                node.textContent?.includes('Balance due'),
            );
            expect(balanceCell?.textContent).toMatch(/LKR\s*40\.00/);
        });

        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledTimes(1);
        });

        const submitted = mutateAsync.mock.calls[0]?.[0];
        if (!submitted) throw new Error('mutateAsync was not called');
        expect(submitted.payload.payment).toMatchObject({
            paymentMethod: 'Cash',
            cashAmount: 60,
            cashTendered: 60,
            paymentAmount: 60,
        });
    });

    it('keeps the modal open and surfaces an error banner when the mutation rejects', async () => {
        const failure = new Error('Insufficient stock for product P001');
        const mutateAsync = vi
            .fn<(args: IMutateArgs) => Promise<ISale>>()
            .mockRejectedValue(failure);
        usePosCreateSaleMock.mockReturnValue({
            mutateAsync,
            isPending: false,
            error: failure,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const { onSaleCreated, onClose } = renderModal({ invoiceTotal: 100 });

        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalled();
        });

        // Error banner is rendered inline; modal stays open; success
        // callback never fires.
        await waitFor(() => {
            expect(
                screen.getByText(/Could not record the sale/i),
            ).toBeInTheDocument();
        });
        expect(onSaleCreated).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
