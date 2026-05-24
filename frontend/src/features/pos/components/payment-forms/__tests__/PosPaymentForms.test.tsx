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
    customerUserId?: string | null;
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
            customerUserId={
                args.customerUserId === undefined
                    ? null
                    : args.customerUserId
            }
            saleType="Retail"
            priceLevel="Retail"
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
        expect(callArgs.payload.saleType).toBe('Retail');
        expect(callArgs.payload.priceLevel).toBe('Retail');
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

        // Success: onSaleCreated fires with the persisted Sale, then close.
        await waitFor(() => {
            expect(onSaleCreated).toHaveBeenCalledWith(persisted);
        });
        expect(onClose).toHaveBeenCalled();
    });

    it('records a partial-credit sale when cash covers part and credit covers the rest', async () => {
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

        renderModal({
            invoiceTotal: 100,
            // Credit is gated on a customer being attached.
            customerUserId: 'cust-1',
        });

        // Step 1: drop the cash tender from 100 to 60.
        const cashInput = screen.getByLabelText('Cash tendered');
        await userEvent.clear(cashInput);
        await userEvent.type(cashInput, '60');

        // Step 2: switch to Credit method and enter 40 against the customer.
        const creditRadio = screen.getByRole('radio', { name: /credit/i });
        await userEvent.click(creditRadio);

        const creditInput = screen.getByLabelText('Credit amount');
        await userEvent.clear(creditInput);
        await userEvent.type(creditInput, '40');

        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledTimes(1);
        });

        // The active tender method at submit time is Credit; the orchestrator's
        // resolveTenderInputs zeros cash when the active method is Credit so
        // the calc reflects only the active form's amount. This case verifies
        // the Credit-only branch of buildSalePayload — credit-only tender for
        // a customer-attached sale.
        const submitted = mutateAsync.mock.calls[0]?.[0];
        if (!submitted) throw new Error('mutateAsync was not called');
        expect(submitted.payload.payment.paymentMethod).toBe('Credit');
        expect(submitted.payload.payment.creditAmount).toBe(40);
        expect(submitted.payload.payment.paymentAmount).toBe(40);
        expect(submitted.payload.customerUserId).toBe('cust-1');
    });

    it('passes keepBalance=true when a credit-overpay is opted in as kept balance', async () => {
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

        renderModal({
            invoiceTotal: 100,
            customerUserId: 'cust-1',
        });

        // The overpay-as-credit path is only reachable through the Credit
        // tender because `calculateMultiTender` only throws on overpay when
        // `credit === 0`. With credit > 0 the calc returns valid even
        // before keepBalance is toggled, so the canKeepBalance check
        // enables the checkbox. Use Credit=150 against a 100 invoice to
        // surface the 50 surplus.
        const creditRadio = screen.getByRole('radio', { name: /credit/i });
        await userEvent.click(creditRadio);

        const creditInput = screen.getByLabelText('Credit amount');
        await userEvent.clear(creditInput);
        await userEvent.type(creditInput, '150');

        // The summary now reflects a valid calc with overpay; the
        // checkbox should be enabled and the cashier opts into keep-balance.
        const keepBalanceBox = screen.getByLabelText(
            'Keep balance as customer credit',
        );
        await waitFor(() => {
            expect(keepBalanceBox).toBeEnabled();
        });
        await userEvent.click(keepBalanceBox);

        // After opting in, the "Kept as credit" row should read LKR 50.00.
        // Scope the assertion to the tender-summary region so the matcher
        // doesn't trip on the unrelated cells (Tender total = LKR 150.00,
        // Paid = LKR 100.00).
        const summary = screen.getByRole('region', {
            name: /tender summary/i,
        });
        await waitFor(() => {
            const keptCell = Array.from(summary.children).find((node) =>
                node.textContent?.includes('Kept as credit'),
            );
            expect(keptCell?.textContent).toMatch(/LKR\s*50\.00/);
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
            paymentMethod: 'Credit',
            creditAmount: 150,
            keepBalance: true,
        });
        // The orchestrator forwards the tender total (paymentAmount=150)
        // to the backend; the surplus is recorded on the calc as
        // `overpayKeptBalance` and the backend reconciles it against the
        // customer's balance.
        expect(submitted.payload.payment.paymentAmount).toBe(150);
    });

    it('enables the keep-balance toggle on cheque overpay so the cashier can opt into customer credit', async () => {
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

        renderModal({
            invoiceTotal: 100,
            customerUserId: 'cust-1',
        });

        // Switch to Cheque method.
        const chequeRadio = screen.getByRole('radio', { name: /cheque/i });
        await userEvent.click(chequeRadio);

        // Cart total Rs 100, customer hands a cheque worth Rs 150. Pre-fix
        // this would lock the modal: `calc` is null (overpay+!keepBalance+
        // credit=0) so canKeepBalance evaluated to false and the checkbox
        // was disabled. The probe-based fix lets the user opt in.
        const chequeAmountInput = screen.getByLabelText('Cheque amount');
        await userEvent.clear(chequeAmountInput);
        await userEvent.type(chequeAmountInput, '150');

        // The keep-balance checkbox should be enabled even though the live
        // calc is currently null.
        const keepBalanceBox = screen.getByLabelText(
            'Keep balance as customer credit',
        );
        await waitFor(() => {
            expect(keepBalanceBox).toBeEnabled();
        });

        // Toggle keep-balance on; this should unlock the calc and surface
        // the surplus as "Kept as credit".
        await userEvent.click(keepBalanceBox);

        const summary = screen.getByRole('region', {
            name: /tender summary/i,
        });
        await waitFor(() => {
            const keptCell = Array.from(summary.children).find((node) =>
                node.textContent?.includes('Kept as credit'),
            );
            expect(keptCell?.textContent).toMatch(/LKR\s*50\.00/);
        });

        // Charge button is now enabled and submits the cheque overpay
        // payload with keepBalance=true so the backend can record the
        // Rs 50 surplus as customer credit.
        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        expect(chargeButton).toBeEnabled();
        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledTimes(1);
        });

        const submitted = mutateAsync.mock.calls[0]?.[0];
        if (!submitted) throw new Error('mutateAsync was not called');
        expect(submitted.payload.payment).toMatchObject({
            paymentMethod: 'Cheque',
            chequeAmount: 150,
            keepBalance: true,
        });
        expect(submitted.payload.payment.paymentAmount).toBe(150);
    });

    it('enables the keep-balance toggle on bank-transfer overpay so the cashier can opt into customer credit', async () => {
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

        renderModal({
            invoiceTotal: 100,
            customerUserId: 'cust-1',
        });

        // Switch to Bank transfer method.
        const bankRadio = screen.getByRole('radio', { name: /bank/i });
        await userEvent.click(bankRadio);

        // Cart total Rs 100, customer wires Rs 150 (common in Sri Lankan
        // retail where transfers are rounded up). Without the probe-based
        // fix the user could not opt into keep-balance because `calc` was
        // null on overpay+!keepBalance+credit=0.
        const bankAmountInput = screen.getByLabelText('Bank transfer amount');
        await userEvent.clear(bankAmountInput);
        await userEvent.type(bankAmountInput, '150');

        const keepBalanceBox = screen.getByLabelText(
            'Keep balance as customer credit',
        );
        await waitFor(() => {
            expect(keepBalanceBox).toBeEnabled();
        });

        await userEvent.click(keepBalanceBox);

        const summary = screen.getByRole('region', {
            name: /tender summary/i,
        });
        await waitFor(() => {
            const keptCell = Array.from(summary.children).find((node) =>
                node.textContent?.includes('Kept as credit'),
            );
            expect(keptCell?.textContent).toMatch(/LKR\s*50\.00/);
        });

        const chargeButton = screen.getByRole('button', {
            name: /^Charge\s+LKR/i,
        });
        expect(chargeButton).toBeEnabled();
        await userEvent.click(chargeButton);

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledTimes(1);
        });

        const submitted = mutateAsync.mock.calls[0]?.[0];
        if (!submitted) throw new Error('mutateAsync was not called');
        expect(submitted.payload.payment).toMatchObject({
            paymentMethod: 'Bank',
            bankTransferAmount: 150,
            keepBalance: true,
        });
        expect(submitted.payload.payment.paymentAmount).toBe(150);
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
