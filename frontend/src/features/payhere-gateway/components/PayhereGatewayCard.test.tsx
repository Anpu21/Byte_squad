import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PayhereGatewayCard } from './PayhereGatewayCard';
import type { GatewayState } from '../types';

const state: GatewayState = {
    payment: {
        provider: 'payhere',
        actionUrl: 'https://sandbox.payhere.lk/pay/checkout',
        fields: { merchant_id: 'M', order_id: 'O123', amount: '1240.00' },
    },
    orderCode: 'ORD-A7QXM3K2',
    branchName: 'Kandy',
    finalTotal: 1240,
    itemCount: 3,
};

function setup(secondsLeft = 2, onCancel = vi.fn()) {
    const ref = createRef<HTMLFormElement>();
    render(
        <MemoryRouter>
            <PayhereGatewayCard
                state={state}
                formRef={ref}
                secondsLeft={secondsLeft}
                onCancel={onCancel}
            />
        </MemoryRouter>,
    );
    return { ref, onCancel };
}

describe('PayhereGatewayCard', () => {
    it('renders the order code', () => {
        setup();
        expect(screen.getByText(/ORD-A7QXM3K2/)).toBeInTheDocument();
    });

    it('renders the formatted total in LKR', () => {
        setup();
        // formatCurrency uses Intl.NumberFormat which may use a non-breaking
        // space between the symbol and the amount, so we match flexibly.
        expect(
            screen.getByText((text) => /LKR\s*1,240\.00/.test(text)),
        ).toBeInTheDocument();
    });

    it('renders the item count and branch name', () => {
        setup();
        expect(screen.getByText(/3 items/)).toBeInTheDocument();
        expect(screen.getByText(/Kandy/)).toBeInTheDocument();
    });

    it('renders 1 item singular when itemCount is 1', () => {
        const ref = createRef<HTMLFormElement>();
        render(
            <MemoryRouter>
                <PayhereGatewayCard
                    state={{ ...state, itemCount: 1 }}
                    formRef={ref}
                    secondsLeft={2}
                    onCancel={vi.fn()}
                />
            </MemoryRouter>,
        );
        expect(screen.getByText(/1 item /)).toBeInTheDocument();
    });

    it('renders the visible countdown', () => {
        setup(2);
        expect(screen.getByText(/Redirecting in 2/)).toBeInTheDocument();
    });

    it('calls onCancel when the cancel button is clicked', () => {
        const onCancel = vi.fn();
        setup(2, onCancel);
        fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('renders the hidden PayHere form with action URL and fields', () => {
        const { ref } = setup();
        expect(ref.current).not.toBeNull();
        expect(ref.current?.getAttribute('action')).toBe(
            'https://sandbox.payhere.lk/pay/checkout',
        );
        const hidden = ref.current?.querySelectorAll('input[type="hidden"]');
        expect(hidden?.length).toBe(3);
    });
});
