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

type TVoidMock = ReturnType<typeof vi.fn<() => void>>;

interface IRenderArgs {
    isCartEmpty?: boolean;
    hasLastReceipt?: boolean;
    onFocusSearch?: TVoidMock;
    onClearCart?: TVoidMock;
    onPrintLastReceipt?: TVoidMock;
    onShowRecent?: TVoidMock;
    onCharge?: TVoidMock;
}

function renderBar(args: IRenderArgs = {}): {
    onFocusSearch: TVoidMock;
    onClearCart: TVoidMock;
    onPrintLastReceipt: TVoidMock;
    onShowRecent: TVoidMock;
    onCharge: TVoidMock;
} {
    const onFocusSearch = args.onFocusSearch ?? vi.fn<() => void>();
    const onClearCart = args.onClearCart ?? vi.fn<() => void>();
    const onPrintLastReceipt = args.onPrintLastReceipt ?? vi.fn<() => void>();
    const onShowRecent = args.onShowRecent ?? vi.fn<() => void>();
    const onCharge = args.onCharge ?? vi.fn<() => void>();
    render(
        <PosActionButtons
            onFocusSearch={onFocusSearch}
            onClearCart={onClearCart}
            onPrintLastReceipt={onPrintLastReceipt}
            onShowRecent={onShowRecent}
            onCharge={onCharge}
            isCartEmpty={args.isCartEmpty ?? false}
            hasLastReceipt={args.hasLastReceipt ?? true}
            disableCharge={args.isCartEmpty ?? false}
        />,
    );
    return {
        onFocusSearch,
        onClearCart,
        onPrintLastReceipt,
        onShowRecent,
        onCharge,
    };
}

describe('PosActionButtons', () => {
    beforeEach(() => {
        confirmMock.mockReset();
    });

    it('renders all five shortcut buttons with their F-key labels', () => {
        renderBar();
        const labels = ['Search', 'Clear cart', 'Print last', 'Recent sales', 'Charge'];
        for (const label of labels) {
            expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        }
        expect(screen.getByRole('button', { name: /Search/i })).toHaveTextContent('F2');
        expect(screen.getByRole('button', { name: /Charge/i })).toHaveTextContent('F12');
    });

    it('fires onCharge when the F12 key is pressed at document level', async () => {
        const { onCharge } = renderBar();
        await userEvent.keyboard('{F12}');
        expect(onCharge).toHaveBeenCalledTimes(1);
    });

    it('disables the clear-cart and charge buttons and ignores F5/F12 when the cart is empty', async () => {
        const { onClearCart, onCharge } = renderBar({ isCartEmpty: true });
        expect(screen.getByRole('button', { name: /Clear cart/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /Charge/i })).toBeDisabled();
        await userEvent.keyboard('{F5}');
        await userEvent.keyboard('{F12}');
        // useConfirm is the gate; with an empty cart, the F-key handler bails
        // *before* opening the confirm. Both spies stay un-invoked.
        expect(confirmMock).not.toHaveBeenCalled();
        expect(onClearCart).not.toHaveBeenCalled();
        expect(onCharge).not.toHaveBeenCalled();
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
        const { onCharge } = renderBar();
        await userEvent.keyboard('{Control>}{F12}{/Control}');
        expect(onCharge).not.toHaveBeenCalled();
    });

    it('disables F9 (print last) until a receipt is available', () => {
        renderBar({ hasLastReceipt: false });
        expect(screen.getByRole('button', { name: /Print last/i })).toBeDisabled();
    });
});
