import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosInvoiceTotal } from '../PosInvoiceTotal';

function renderTotal(
    overrides: Partial<{
        itemsSubtotal: number;
        totalLineDiscount: number;
        totalTax: number;
        cartDiscountPercentage: number;
    }> = {},
    onCartDiscountChange = vi.fn(),
) {
    const props = {
        itemsSubtotal: 1000,
        totalLineDiscount: 0,
        totalTax: 150,
        cartDiscountPercentage: 0,
        onCartDiscountChange,
        ...overrides,
    };
    const utils = render(<PosInvoiceTotal {...props} />);
    return { ...utils, onCartDiscountChange, props };
}

describe('PosInvoiceTotal', () => {
    it('renders the five totals rows with the computed grand total', () => {
        renderTotal();
        const section = screen.getByRole('region', { name: /invoice totals/i });
        const utils = within(section);
        expect(utils.getByText('Subtotal')).toBeInTheDocument();
        expect(utils.getByText('Line discount')).toBeInTheDocument();
        expect(utils.getByText('Cart discount')).toBeInTheDocument();
        expect(utils.getByText('Tax')).toBeInTheDocument();
        expect(utils.getByText('Total')).toBeInTheDocument();
        // 1000 subtotal + 150 tax, no cart discount -> 1150.00
        expect(
            utils.getByLabelText('Grand total').textContent,
        ).toMatch(/1,150\.00/);
    });

    it('fires onCartDiscountChange with the parsed number when the cashier types a value', async () => {
        const onCartDiscountChange = vi.fn();
        renderTotal({}, onCartDiscountChange);
        const input = screen.getByLabelText('Cart discount percentage');
        await userEvent.clear(input);
        await userEvent.type(input, '10');
        // The numeric cell commits live on every complete number string,
        // so the final call must carry the integer the cashier typed.
        const calls = onCartDiscountChange.mock.calls.map((c) => c[0]);
        expect(calls).toContain(10);
    });

    it('clamps the discount input to the [0, 100] range', async () => {
        const onCartDiscountChange = vi.fn();
        renderTotal({}, onCartDiscountChange);
        const input = screen.getByLabelText('Cart discount percentage');
        await userEvent.clear(input);
        // Type a value well over 100 to exercise the clamp; PosCartNumericCell
        // emits the clamped value on commit.
        await userEvent.type(input, '250');
        const calls = onCartDiscountChange.mock.calls.map((c) => c[0]);
        expect(Math.max(...calls)).toBeLessThanOrEqual(100);
    });

    it('updates the grand total when the cartDiscountPercentage prop changes', () => {
        const { rerender } = renderTotal({
            itemsSubtotal: 1000,
            totalTax: 0,
            cartDiscountPercentage: 0,
        });
        // 1000 - 0% + 0 tax = 1000
        expect(
            screen.getByLabelText('Grand total').textContent,
        ).toMatch(/1,000\.00/);

        rerender(
            <PosInvoiceTotal
                itemsSubtotal={1000}
                totalLineDiscount={0}
                totalTax={0}
                cartDiscountPercentage={20}
                onCartDiscountChange={vi.fn()}
            />,
        );
        // 1000 - 20% (200) + 0 tax = 800
        expect(
            screen.getByLabelText('Grand total').textContent,
        ).toMatch(/800\.00/);
    });
});
