import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosPaymentMethod } from '../PosPaymentMethod';

describe('PosPaymentMethod', () => {
    it('renders the Cash + Card pills, marks the active one, and omits removed tenders', () => {
        render(<PosPaymentMethod value="Cash" onChange={() => {}} />);
        for (const label of ['Cash', 'Card']) {
            expect(screen.getByRole('radio', { name: new RegExp(label, 'i') })).toBeInTheDocument();
        }
        for (const gone of ['Mobile', 'Cheque', 'Bank']) {
            expect(screen.queryByRole('radio', { name: new RegExp(gone, 'i') })).toBeNull();
        }
        const cash = screen.getByRole('radio', { name: /Cash/i });
        expect(cash).toHaveAttribute('aria-checked', 'true');
        const card = screen.getByRole('radio', { name: /Card/i });
        expect(card).toHaveAttribute('aria-checked', 'false');
    });

    it('fires onChange when a non-active pill is clicked', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.click(screen.getByRole('radio', { name: /Card/i }));
        expect(onChange).toHaveBeenCalledExactlyOnceWith('Card');
    });

    it('switches to Card when the "2" key is pressed at document level', async () => {
        const onChange = vi.fn();
        render(<PosPaymentMethod value="Cash" onChange={onChange} />);
        await userEvent.keyboard('2');
        expect(onChange).toHaveBeenCalledExactlyOnceWith('Card');
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
        await userEvent.keyboard('{Control>}2{/Control}');
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
        await userEvent.keyboard('2');
        expect(onChange).not.toHaveBeenCalled();
    });
});
