import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosActionButtons } from '../PosActionButtons';

// useConfirm is wired into the clear-cart flow. Mock it so the tests can
// drive both the confirm and cancel branches deterministically without
// needing the ConfirmProvider in the DOM tree.
const confirmMock = vi.fn();
vi.mock('@/hooks/useConfirm', () => ({
    useConfirm: () => confirmMock,
}));

interface IRenderArgs {
    isCartEmpty?: boolean;
    hasLastReceipt?: boolean;
    onFocusSearch?: ReturnType<typeof vi.fn>;
    onTogglePriceLevel?: ReturnType<typeof vi.fn>;
    onOpenCustomerPicker?: ReturnType<typeof vi.fn>;
    onClearCart?: ReturnType<typeof vi.fn>;
    onPrintLastReceipt?: ReturnType<typeof vi.fn>;
    onShowRecent?: ReturnType<typeof vi.fn>;
    onOpenPayment?: ReturnType<typeof vi.fn>;
}

function renderBar(args: IRenderArgs = {}): {
    onFocusSearch: ReturnType<typeof vi.fn>;
    onTogglePriceLevel: ReturnType<typeof vi.fn>;
    onOpenCustomerPicker: ReturnType<typeof vi.fn>;
    onClearCart: ReturnType<typeof vi.fn>;
    onPrintLastReceipt: ReturnType<typeof vi.fn>;
    onShowRecent: ReturnType<typeof vi.fn>;
    onOpenPayment: ReturnType<typeof vi.fn>;
} {
    const onFocusSearch = args.onFocusSearch ?? vi.fn();
    const onTogglePriceLevel = args.onTogglePriceLevel ?? vi.fn();
    const onOpenCustomerPicker = args.onOpenCustomerPicker ?? vi.fn();
    const onClearCart = args.onClearCart ?? vi.fn();
    const onPrintLastReceipt = args.onPrintLastReceipt ?? vi.fn();
    const onShowRecent = args.onShowRecent ?? vi.fn();
    const onOpenPayment = args.onOpenPayment ?? vi.fn();
    render(
        <PosActionButtons
            onFocusSearch={onFocusSearch}
            onTogglePriceLevel={onTogglePriceLevel}
            onOpenCustomerPicker={onOpenCustomerPicker}
            onClearCart={onClearCart}
            onPrintLastReceipt={onPrintLastReceipt}
            onShowRecent={onShowRecent}
            onOpenPayment={onOpenPayment}
            isCartEmpty={args.isCartEmpty ?? false}
            hasLastReceipt={args.hasLastReceipt ?? true}
        />,
    );
    return {
        onFocusSearch,
        onTogglePriceLevel,
        onOpenCustomerPicker,
        onClearCart,
        onPrintLastReceipt,
        onShowRecent,
        onOpenPayment,
    };
}

describe('PosActionButtons', () => {
    beforeEach(() => {
        confirmMock.mockReset();
    });

    it('renders all seven shortcut buttons with their F-key labels', () => {
        renderBar();
        const labels = ['Search', 'Price level', 'Customer', 'Clear cart', 'Print last', 'Recent sales', 'Charge'];
        for (const label of labels) {
            expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        }
        expect(screen.getByRole('button', { name: /Search/i })).toHaveTextContent('F2');
        expect(screen.getByRole('button', { name: /Customer/i })).toHaveTextContent('F4');
        expect(screen.getByRole('button', { name: /Charge/i })).toHaveTextContent('F12');
    });

    it('fires onOpenCustomerPicker when the Customer (F4) button is clicked', async () => {
        const { onOpenCustomerPicker } = renderBar();
        await userEvent.click(screen.getByRole('button', { name: /Customer/i }));
        expect(onOpenCustomerPicker).toHaveBeenCalledTimes(1);
    });

    it('fires onOpenPayment when the F12 key is pressed at document level', async () => {
        const { onOpenPayment } = renderBar();
        await userEvent.keyboard('{F12}');
        expect(onOpenPayment).toHaveBeenCalledTimes(1);
    });

    it('disables the clear-cart and charge buttons and ignores F5/F12 when the cart is empty', async () => {
        const { onClearCart, onOpenPayment } = renderBar({ isCartEmpty: true });
        expect(screen.getByRole('button', { name: /Clear cart/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Charge/i })).toBeDisabled();
        await userEvent.keyboard('{F5}');
        await userEvent.keyboard('{F12}');
        // useConfirm is the gate; with an empty cart, the F-key handler bails
        // *before* opening the confirm. Both spies stay un-invoked.
        expect(confirmMock).not.toHaveBeenCalled();
        expect(onClearCart).not.toHaveBeenCalled();
        expect(onOpenPayment).not.toHaveBeenCalled();
    });

    it('opens the confirm prompt on F5 with a non-empty cart and clears only on confirm', async () => {
        confirmMock.mockResolvedValueOnce(true);
        const { onClearCart } = renderBar({ isCartEmpty: false });
        await userEvent.keyboard('{F5}');
        // Wait for the async confirm chain to flush.
        await Promise.resolve();
        expect(confirmMock).toHaveBeenCalledTimes(1);
        // Microtask flush so the `.then(ok => onClearCart())` resolves.
        await Promise.resolve();
        expect(onClearCart).toHaveBeenCalledTimes(1);

        // Cancel branch: confirm resolves false; onClearCart must not fire again.
        confirmMock.mockResolvedValueOnce(false);
        await userEvent.click(screen.getByRole('button', { name: /Clear cart/i }));
        await Promise.resolve();
        await Promise.resolve();
        expect(onClearCart).toHaveBeenCalledTimes(1);
    });

    it('ignores F12 when a modifier key is held so browser shortcuts keep working', async () => {
        const { onOpenPayment } = renderBar();
        await userEvent.keyboard('{Control>}{F12}{/Control}');
        expect(onOpenPayment).not.toHaveBeenCalled();
    });

    it('disables F9 (print last) until a receipt is available', () => {
        renderBar({ hasLastReceipt: false });
        expect(screen.getByRole('button', { name: /Print last/i })).toBeDisabled();
    });
});
