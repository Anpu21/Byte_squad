import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosCreditForm } from '../PosCreditForm';

describe('PosCreditForm', () => {
    it('shows a gating message when no customer is attached', () => {
        render(
            <PosCreditForm
                customerUserId={null}
                creditAmount={0}
                onCreditAmountChange={() => {}}
            />,
        );
        expect(
            screen.getByText(/select a customer to use credit/i),
        ).toBeInTheDocument();
        // The amount input must not exist while the gate is active.
        expect(screen.queryByLabelText('Credit amount')).toBeNull();
    });

    it('renders the credit-amount input when a customer is attached', () => {
        render(
            <PosCreditForm
                customerUserId="cust-1"
                creditAmount={200}
                onCreditAmountChange={() => {}}
            />,
        );
        const input = screen.getByLabelText('Credit amount');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue(200);
    });

    it('emits onCreditAmountChange when the amount is committed', async () => {
        const onChange = vi.fn();
        render(
            <PosCreditForm
                customerUserId="cust-1"
                creditAmount={0}
                onCreditAmountChange={onChange}
            />,
        );
        const input = screen.getByLabelText('Credit amount');
        await userEvent.clear(input);
        await userEvent.type(input, '300');
        expect(onChange).toHaveBeenLastCalledWith(300);
    });
});
