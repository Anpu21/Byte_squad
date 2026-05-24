import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosPaymentMethod } from '../PosPaymentMethod';

describe('PosPaymentMethod', () => {
    it('renders all six payment-method pills and marks the active one', () => {
        render(<PosPaymentMethod value="Cash" onChange={() => {}} />);
        const labels = ['Cash', 'Card', 'Mobile', 'Cheque', 'Bank', 'Credit'];
        for (const label of labels) {
            expect(screen.getByRole('radio', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        }
        const cash = screen.getByRole('radio', { name: /Cash/i });
        expect(cash).toHaveAttribute('aria-checked', 'true');
        const card = screen.getByRole('radio', { name: /Card/i });
        expect(card).toHaveAttribute('aria-checked', 'false');
    });

    it('fires onChange when a non-active pill is clicked', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.click(screen.getByRole('radio', { name: /Cheque/i }));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('Cheque');
    });

    it('switches to Mobile when the "3" key is pressed at document level', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.keyboard('3');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('Mobile');
    });

    it('does not fire onChange when the same shortcut as the active method is pressed', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.keyboard('1');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores shortcuts when a modifier key is held', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.keyboard('{Control>}3{/Control}');
        expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores shortcuts while typing in an input', async () => {
        const onChange = vi.fn();
        render(
            <>
                <PosPaymentMethod value="Cash" onChange={onChange} />
                <input aria-label="distraction" />
            </>,
        );
        const input = screen.getByLabelText('distraction');
        await userEvent.click(input);
        await userEvent.keyboard('3');
        expect(onChange).not.toHaveBeenCalled();
    });
});
