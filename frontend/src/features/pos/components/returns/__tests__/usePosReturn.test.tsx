import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePosReturn } from '../usePosReturn';
import { returnsService } from '@/services/returns.service';
import type { ISaleReturnLookup } from '@/types';

vi.mock('@/services/returns.service', () => ({
    returnsService: {
        lookup: vi.fn(),
        create: vi.fn(),
    },
}));
vi.mock('react-hot-toast', () => ({
    default: { success: vi.fn(), error: vi.fn() },
}));

const mockedService = vi.mocked(returnsService);

// quantitySold 2 · lineTotal 1000 → discount-aware perUnit = 500.
// unitPrice is deliberately 600 so a wrong basis (unitPrice) is detectable.
const LOOKUP: ISaleReturnLookup = {
    saleId: 'sale-1',
    invoiceNumber: 'INV-2026-000002',
    branchId: 'b1',
    customerUserId: null,
    total: 1000,
    createdAt: '2026-07-02T13:45:30.000Z',
    lines: [
        {
            saleItemId: 'si-1',
            productId: 'p1',
            productName: 'Apples',
            barcode: '',
            unitLabel: 'unit',
            quantitySold: 2,
            alreadyReturned: 0,
            remaining: 2,
            unitPrice: 600,
            lineTotal: 1000,
        },
    ],
};

function createWrapper() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
}

const fakeEvent = {
    preventDefault: vi.fn(),
} as unknown as React.FormEvent;

async function renderLoaded() {
    const utils = renderHook(() => usePosReturn(vi.fn()), {
        wrapper: createWrapper(),
    });
    act(() => utils.result.current.setInvoice('INV-2026-000002'));
    await act(async () => {
        await utils.result.current.handleLookup(fakeEvent);
    });
    await waitFor(() =>
        expect(utils.result.current.returnableLines).toHaveLength(1),
    );
    return utils;
}

describe('usePosReturn', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedService.lookup.mockResolvedValue(LOOKUP);
    });

    it('clamps a quantity to the returnable remainder', async () => {
        const { result } = await renderLoaded();

        act(() => result.current.patchQty('si-1', 'good', '5'));

        const line = result.current.parsed[0]!;
        expect(line.draft.good).toBe('2'); // clamped from 5 → remaining 2
        expect(line.over).toBe(false);
        expect(result.current.overCap).toBe(false);
    });

    it('refunds on the discount-aware per-unit price, not unitPrice', async () => {
        const { result } = await renderLoaded();

        act(() => result.current.patchQty('si-1', 'good', '2'));

        // 2 × (lineTotal 1000 / qty 2 = 500) = 1000, NOT 2 × unitPrice 600 = 1200.
        expect(result.current.parsed[0]!.refund).toBe(1000);
        expect(result.current.refundTotal).toBe(1000);
    });

    it('clamps the second field against the sibling so good+bad <= remaining', async () => {
        const { result } = await renderLoaded();

        act(() => result.current.patchQty('si-1', 'good', '2'));
        act(() => result.current.patchQty('si-1', 'bad', '5'));

        const line = result.current.parsed[0]!;
        expect(line.draft.bad).toBe('0'); // remaining 2 − good 2 = 0
        expect(line.total).toBe(2);
        expect(line.over).toBe(false);
    });

    it('cannot submit until a valid quantity is picked', async () => {
        const { result } = await renderLoaded();
        expect(result.current.canSubmit).toBe(false);

        act(() => result.current.patchQty('si-1', 'good', '1'));
        expect(result.current.canSubmit).toBe(true);
    });
});
