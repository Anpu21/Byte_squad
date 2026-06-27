import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePosHeldBills } from '../usePosHeldBills';
import { heldSalesService } from '@/services/held-sales.service';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { IHeldBill } from '@/features/pos/types/held-bill.type';
import type { IHeldSale } from '@/types';

vi.mock('@/services/held-sales.service', () => ({
    heldSalesService: {
        list: vi.fn(),
        hold: vi.fn(),
        discard: vi.fn(),
    },
}));

const mockedService = vi.mocked(heldSalesService);

const ITEM: ICartItem = {
    rowId: 'row-1',
    productId: 'p1',
    productCode: 'P001',
    productName: 'Anchor Milk 1L',
    productType: 'Grocery',
    baseUnit: 'L',
    unitId: null,
    unitName: 'L',
    unitPrice: 575,
    conversionFactor: 1,
    quantity: 2,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
    lineSubtotal: 1150,
    lineDiscountAmount: 0,
    lineTaxAmount: 0,
    lineTotal: 1150,
    baseUnitQty: 2,
};

const SALE: IHeldSale = {
    id: 'held-1',
    label: 'Anchor Milk 1L',
    itemCount: 1,
    total: 1150,
    snapshot: {
        items: [ITEM],
        cartDiscountPercentage: 5,
        loyaltyOwner: null,
        loyaltyRedeemPoints: 0,
    },
    heldByName: 'Nadia Perera',
    createdAt: '2026-06-20T10:00:00.000Z',
};

function createWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

describe('usePosHeldBills', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedService.list.mockResolvedValue([]);
        mockedService.hold.mockResolvedValue(SALE);
        mockedService.discard.mockResolvedValue(undefined);
    });

    it('maps server-held sales into restorable bills', async () => {
        mockedService.list.mockResolvedValue([SALE]);
        const { result } = renderHook(() => usePosHeldBills(), {
            wrapper: createWrapper(),
        });

        await waitFor(() =>
            expect(result.current.heldBills).toHaveLength(1),
        );
        const bill = result.current.heldBills[0]!;
        expect(bill.label).toBe('Anchor Milk 1L');
        expect(bill.heldByName).toBe('Nadia Perera');
        expect(bill.items[0]?.productName).toBe('Anchor Milk 1L');
        expect(bill.cartDiscountPercentage).toBe(5);
    });

    it('holdBill posts a derived payload (itemCount + total + snapshot)', async () => {
        const { result } = renderHook(() => usePosHeldBills(), {
            wrapper: createWrapper(),
        });
        await waitFor(() => expect(mockedService.list).toHaveBeenCalled());

        act(() =>
            result.current.holdBill({
                label: 'Anchor Milk 1L',
                items: [ITEM],
                cartDiscountPercentage: 5,
                loyaltyOwner: null,
                loyaltyRedeemPoints: 0,
            }),
        );

        await waitFor(() =>
            expect(mockedService.hold).toHaveBeenCalledTimes(1),
        );
        expect(mockedService.hold).toHaveBeenCalledWith(
            expect.objectContaining({
                label: 'Anchor Milk 1L',
                itemCount: 1,
                total: 1150,
                snapshot: expect.objectContaining({
                    cartDiscountPercentage: 5,
                }),
            }),
        );
    });

    it('takeBill returns the bill and removes it server-side', async () => {
        mockedService.list.mockResolvedValue([SALE]);
        const { result } = renderHook(() => usePosHeldBills(), {
            wrapper: createWrapper(),
        });
        await waitFor(() =>
            expect(result.current.heldBills).toHaveLength(1),
        );

        let taken: IHeldBill | null = null;
        act(() => {
            taken = result.current.takeBill('held-1');
        });
        expect(taken!.items[0]?.productName).toBe('Anchor Milk 1L');
        await waitFor(() =>
            expect(mockedService.discard).toHaveBeenCalledWith('held-1'),
        );
    });

    it('takeBill returns null for an unknown id', async () => {
        mockedService.list.mockResolvedValue([SALE]);
        const { result } = renderHook(() => usePosHeldBills(), {
            wrapper: createWrapper(),
        });
        await waitFor(() =>
            expect(result.current.heldBills).toHaveLength(1),
        );

        let taken: IHeldBill | null = null;
        act(() => {
            taken = result.current.takeBill('missing');
        });
        expect(taken).toBeNull();
        expect(mockedService.discard).not.toHaveBeenCalled();
    });

    it('discardBill removes a parked bill', async () => {
        mockedService.list.mockResolvedValue([SALE]);
        const { result } = renderHook(() => usePosHeldBills(), {
            wrapper: createWrapper(),
        });
        await waitFor(() =>
            expect(result.current.heldBills).toHaveLength(1),
        );

        act(() => result.current.discardBill('held-1'));
        await waitFor(() =>
            expect(mockedService.discard).toHaveBeenCalledWith('held-1'),
        );
    });
});
