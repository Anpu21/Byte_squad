import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosBankTransferForm } from '../PosBankTransferForm';

describe('PosBankTransferForm', () => {
    it('renders amount and reference fields with seeded values', () => {
        render(
            <PosBankTransferForm
                bankTransferAmount={250}
                bankRef="TX-123"
                onChange={() => {}}
            />,
        );
        expect(
            screen.getByLabelText('Bank transfer amount'),
        ).toHaveValue(250);
        expect(screen.getByLabelText('Bank reference')).toHaveValue(
            'TX-123',
        );
    });

    it('emits patches for amount and reference on change', async () => {
        const onChange = vi.fn();
        render(
            <PosBankTransferForm
                bankTransferAmount={0}
                bankRef=""
                onChange={onChange}
            />,
        );
        const amount = screen.getByLabelText('Bank transfer amount');
        await userEvent.clear(amount);
        await userEvent.type(amount, '750');
        expect(onChange).toHaveBeenLastCalledWith({
            bankTransferAmount: 750,
        });

        const ref = screen.getByLabelText('Bank reference');
        await userEvent.type(ref, 'A');
        expect(onChange).toHaveBeenLastCalledWith({ bankRef: 'A' });
    });
});
