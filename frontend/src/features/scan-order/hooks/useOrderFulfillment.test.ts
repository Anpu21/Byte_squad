import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { customerOrdersService } from '@/services/customer-orders.service';
import type { ICustomerOrder } from '@/types';
import { useOrderFulfillment } from './useOrderFulfillment';

vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/services/customer-orders.service', () => ({
    customerOrdersService: {
        fulfill: vi.fn(),
    },
}));

const fulfillMock = vi.mocked(customerOrdersService.fulfill);

function makeOrder(overrides: Partial<ICustomerOrder> = {}): ICustomerOrder {
    return {
        id: 'o-1',
        orderCode: 'ORD-ABC12345',
        groupCode: null,
        userId: null,
        branchId: 'b-1',
        status: 'pending',
        estimatedTotal: 100,
        loyaltyDiscountAmount: 0,
        finalTotal: 100,
        paymentMode: 'manual',
        paymentStatus: 'unpaid',
        loyaltyPointsRedeemed: 0,
        loyaltyPointsEarned: 0,
        guestName: 'Guest',
        note: null,
        fulfilledTransactionId: null,
        qrCodeUrl: null,
        items: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('useOrderFulfillment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fulfillMock.mockResolvedValue({ order: makeOrder(), transaction: null });
    });

    it('flags a manual unpaid order as fulfillable and payable', () => {
        const { result } = renderHook(() =>
            useOrderFulfillment({ order: makeOrder() }),
        );
        expect(result.current.requiresPayment).toBe(true);
        expect(result.current.isOnlineBlocked).toBe(false);
        expect(result.current.isFulfillable).toBe(true);
    });

    it('charges cash when confirming a manual order', async () => {
        const onFulfilled = vi.fn();
        const { result } = renderHook(() =>
            useOrderFulfillment({ order: makeOrder(), onFulfilled }),
        );
        await act(async () => {
            await result.current.handleConfirm();
        });
        expect(fulfillMock).toHaveBeenCalledWith('ORD-ABC12345', {
            paymentMethod: 'cash',
        });
        expect(onFulfilled).toHaveBeenCalledOnce();
    });

    it('confirms an online prepaid order without a tender', async () => {
        const { result } = renderHook(() =>
            useOrderFulfillment({
                order: makeOrder({ paymentMode: 'online', paymentStatus: 'paid' }),
            }),
        );
        expect(result.current.requiresPayment).toBe(false);
        expect(result.current.isFulfillable).toBe(true);
        await act(async () => {
            await result.current.handleConfirm();
        });
        expect(fulfillMock).toHaveBeenCalledWith('ORD-ABC12345', {});
    });

    it('blocks an unpaid online order', () => {
        const { result } = renderHook(() =>
            useOrderFulfillment({
                order: makeOrder({
                    paymentMode: 'online',
                    paymentStatus: 'unpaid',
                }),
            }),
        );
        expect(result.current.isOnlineBlocked).toBe(true);
        expect(result.current.isFulfillable).toBe(false);
    });

    it('treats a completed order as not fulfillable', () => {
        const { result } = renderHook(() =>
            useOrderFulfillment({
                order: makeOrder({ status: 'completed', paymentStatus: 'paid' }),
            }),
        );
        expect(result.current.isFulfillable).toBe(false);
    });

    it('does nothing when no order is selected', async () => {
        const { result } = renderHook(() =>
            useOrderFulfillment({ order: null }),
        );
        expect(result.current.isFulfillable).toBe(false);
        await act(async () => {
            await result.current.handleConfirm();
        });
        expect(fulfillMock).not.toHaveBeenCalled();
    });
});
