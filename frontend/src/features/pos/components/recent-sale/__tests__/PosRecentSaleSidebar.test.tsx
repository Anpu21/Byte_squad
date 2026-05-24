import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PropsWithChildren, ReactElement } from 'react';
import { PosRecentSaleSidebar } from '../PosRecentSaleSidebar';
import { posService } from '@/services/pos.service';
import type { IRecentSaleRow } from '@/types';

// Mock the service so the hook chain (TanStack Query + service) resolves
// against test fixtures. Each case controls its own resolved value.
vi.mock('@/services/pos.service', () => ({
    posService: {
        getRecentSales: vi.fn(),
    },
}));

const getRecentSalesMock = vi.mocked(posService.getRecentSales);

function makeRow(overrides: Partial<IRecentSaleRow> = {}): IRecentSaleRow {
    return {
        id: 'sale-1',
        invoiceNumber: 'INV-0001',
        transactionNumber: 'TX-0001',
        total: 1500,
        paidAmount: 1500,
        balanceDue: 0,
        paymentStatus: 'Paid',
        saleType: 'Retail',
        status: 'Active',
        billPrinted: false,
        billPrintCount: 0,
        branchId: 'b1',
        customerUserId: null,
        customerName: null,
        createdAt: new Date().toISOString(),
        ...overrides,
    };
}

function renderSidebar(
    isOpen = true,
    onSelectSale: ReturnType<typeof vi.fn<(saleId: string) => void>> = vi.fn<(saleId: string) => void>(),
    onClose: ReturnType<typeof vi.fn<() => void>> = vi.fn<() => void>(),
): {
    onSelectSale: ReturnType<typeof vi.fn<(saleId: string) => void>>;
    onClose: ReturnType<typeof vi.fn<() => void>>;
} {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
        },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(
        <PosRecentSaleSidebar
            isOpen={isOpen}
            onClose={onClose}
            onSelectSale={onSelectSale}
        />,
        { wrapper: Wrapper },
    );
    return { onSelectSale, onClose };
}

describe('PosRecentSaleSidebar', () => {
    beforeEach(() => {
        getRecentSalesMock.mockReset();
    });

    it('renders nothing when isOpen=false even after the query resolves', () => {
        getRecentSalesMock.mockResolvedValue([makeRow()]);
        renderSidebar(false);
        expect(
            screen.queryByRole('complementary', { name: /recent sales/i }),
        ).not.toBeInTheDocument();
    });

    it('shows the loading state while the recent-sales query is in flight', () => {
        // Hang the mock so the query stays pending and the skeleton is exposed.
        getRecentSalesMock.mockImplementation(
            () => new Promise<IRecentSaleRow[]>(() => {}),
        );
        renderSidebar(true);
        expect(
            screen.getByRole('status', { name: /loading recent sales/i }),
        ).toBeInTheDocument();
    });

    it('shows the empty-state message when the query returns an empty list', async () => {
        getRecentSalesMock.mockResolvedValue([]);
        renderSidebar(true);
        await waitFor(() => {
            expect(screen.getByText(/no recent sales yet/i)).toBeInTheDocument();
        });
    });

    it('renders one row per sale with invoice number, total, and status badge', async () => {
        getRecentSalesMock.mockResolvedValue([
            makeRow({ id: 's1', invoiceNumber: 'INV-001', total: 1000, paymentStatus: 'Paid' }),
            makeRow({
                id: 's2',
                invoiceNumber: 'INV-002',
                total: 500,
                paymentStatus: 'Partially_Paid',
                customerName: 'Jane Doe',
            }),
            makeRow({ id: 's3', invoiceNumber: 'INV-003', total: 250, status: 'Voided' }),
        ]);
        renderSidebar(true);
        await waitFor(() => {
            expect(screen.getByText('INV-001')).toBeInTheDocument();
        });
        expect(screen.getByText('INV-002')).toBeInTheDocument();
        expect(screen.getByText('INV-003')).toBeInTheDocument();

        // Status labels: Paid, Partial, Voided
        expect(screen.getByText('Paid')).toBeInTheDocument();
        expect(screen.getByText('Partial')).toBeInTheDocument();
        expect(screen.getByText('Voided')).toBeInTheDocument();

        // Walk-in fallback shows up when customerName is null; Jane Doe shows on the named row.
        const walkInRows = screen.getAllByText(/Walk-in/i);
        expect(walkInRows.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    });

    it('fires onSelectSale(saleId) when a row is clicked', async () => {
        getRecentSalesMock.mockResolvedValue([
            makeRow({ id: 'sale-42', invoiceNumber: 'INV-042' }),
        ]);
        const { onSelectSale } = renderSidebar(true);
        await waitFor(() => {
            expect(screen.getByText('INV-042')).toBeInTheDocument();
        });
        await userEvent.click(screen.getByRole('button', { name: /INV-042/i }));
        expect(onSelectSale).toHaveBeenCalledExactlyOnceWith('sale-42');
    });

    it('fires onClose when the close button is clicked', async () => {
        getRecentSalesMock.mockResolvedValue([]);
        const onClose = vi.fn<() => void>();
        renderSidebar(true, vi.fn<(saleId: string) => void>(), onClose);
        await userEvent.click(
            screen.getByRole('button', { name: /close recent sales/i }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
