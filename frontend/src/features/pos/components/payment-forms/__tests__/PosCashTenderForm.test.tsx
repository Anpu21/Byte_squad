import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PosCashTenderForm } from '../PosCashTenderForm';

describe('PosCashTenderForm', () => {
    it('renders cash tendered input and derives applied/change rows', () => {
        render(
            <PosCashTenderForm
                invoiceTotal={100}
                cashTendered={150}
                onCashTenderedChange={() => {}}
            />,
        );

        expect(screen.getByLabelText('Cash tendered')).toBeInTheDocument();
        expect(screen.getByText('Cash applied')).toBeInTheDocument();
        expect(screen.getByText('Change')).toBeInTheDocument();
        // Applied should cap at the invoice total (100), change is the leftover (50).
        expect(screen.getByText(/LKR\s*100\.00/)).toBeInTheDocument();
        expect(screen.getByText(/LKR\s*50\.00/)).toBeInTheDocument();
    });

    it('emits onCashTenderedChange when the cashier types a complete number', async () => {
        const onChange = vi.fn();
        render(
            <PosCashTenderForm
                invoiceTotal={100}
                cashTendered={0}
                onCashTenderedChange={onChange}
            />,
        );
        const input = screen.getByLabelText('Cash tendered');
        await userEvent.clear(input);
        await userEvent.type(input, '250');
        expect(onChange).toHaveBeenLastCalledWith(250);
    });

    it('shows zero change when tender equals invoice total', () => {
        render(
            <PosCashTenderForm
                invoiceTotal={100}
                cashTendered={100}
                onCashTenderedChange={() => {}}
            />,
        );
        // Both rows render LKR 100.00 for applied and LKR 0.00 for change.
        const amounts = screen.getAllByText(/LKR/);
        // Two summary cells render currency strings.
        expect(amounts.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText(/LKR\s*0\.00/)).toBeInTheDocument();
    });
});
