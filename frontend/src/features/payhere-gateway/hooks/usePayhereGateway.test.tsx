import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { usePayhereGateway } from './usePayhereGateway';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { GatewayState } from '../types';

const validState: GatewayState = {
    payment: {
        provider: 'payhere',
        actionUrl: 'https://sandbox.payhere.lk/pay/checkout',
        fields: { merchant_id: 'M', order_id: 'O', amount: '1240.00' },
    },
    orderCode: 'ORD-A7QXM3K2',
    branchName: 'Kandy',
    finalTotal: 1240,
    itemCount: 3,
};

function wrap(state: unknown): (props: { children: ReactNode }) => ReactNode {
    return ({ children }) => (
        <MemoryRouter
            initialEntries={[
                { pathname: FRONTEND_ROUTES.SHOP_CHECKOUT_PAY, state },
            ]}
        >
            <Routes>
                <Route
                    path={FRONTEND_ROUTES.SHOP_CHECKOUT_PAY}
                    element={children}
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_ORDER_CONFIRMATION}
                    element={<div data-testid="order-confirmation" />}
                />
                <Route
                    path={FRONTEND_ROUTES.SHOP_MY_ORDERS}
                    element={<div data-testid="my-orders" />}
                />
            </Routes>
        </MemoryRouter>
    );
}

describe('usePayhereGateway', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns null state when location.state is missing', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(null),
        });
        expect(result.current.state).toBeNull();
    });

    it('returns null state when location.state is malformed', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap({ random: 'object' }),
        });
        expect(result.current.state).toBeNull();
    });

    it('returns the gateway state when location.state is valid', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        expect(result.current.state).toEqual(validState);
    });

    it('decrements secondsLeft on each tick', () => {
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        expect(result.current.secondsLeft).toBe(2);

        act(() => {
            vi.advanceTimersByTime(750);
        });
        expect(result.current.secondsLeft).toBe(1);

        act(() => {
            vi.advanceTimersByTime(750);
        });
        expect(result.current.secondsLeft).toBe(0);
    });

    it('calls form.submit() when the countdown reaches zero', () => {
        const submit = vi.fn();
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        // Attach a fake form element to the ref so the hook can submit it.
        Object.defineProperty(result.current.formRef, 'current', {
            value: { submit } as unknown as HTMLFormElement,
            writable: true,
        });

        // Each tick triggers a React state update which schedules the next
        // timeout, so we need to advance time in separate act() calls to let
        // React flush between ticks.
        act(() => {
            vi.advanceTimersByTime(750);
        });
        act(() => {
            vi.advanceTimersByTime(750);
        });

        expect(submit).toHaveBeenCalledTimes(1);
    });

    it('cancel stops the timer and prevents submit', () => {
        const submit = vi.fn();
        const { result } = renderHook(() => usePayhereGateway(), {
            wrapper: wrap(validState),
        });
        Object.defineProperty(result.current.formRef, 'current', {
            value: { submit } as unknown as HTMLFormElement,
            writable: true,
        });

        act(() => {
            result.current.cancel();
        });
        act(() => {
            vi.advanceTimersByTime(750 * 5);
        });

        expect(submit).not.toHaveBeenCalled();
    });
});
