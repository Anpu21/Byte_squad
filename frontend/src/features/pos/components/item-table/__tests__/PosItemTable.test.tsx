import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import type { ISearchProductRow } from '@/types';
import { PosItemTable } from '../PosItemTable';
import { posService } from '@/services/pos.service';

vi.mock('@/services/pos.service', () => ({
    posService: {
        searchProducts: vi.fn(),
        listProductUnits: vi.fn(),
    },
}));

const searchMock = vi.mocked(posService.searchProducts);
const unitsMock = vi.mocked(posService.listProductUnits);

const searchRow: ISearchProductRow = {
    productId: 'p-1',
    productCode: 'PC-001',
    productName: 'Basmati Rice',
    productType: 'Grocery',
    baseUnit: 'kg',
    status: true,
    costPrice: 800,
    retailPrice: 1200,
    taxRate: 0,
    discountAllowed: true,
    imageUrl: null,
    matchedUnit: null,
};

const stagedItem: ICartItem = {
    rowId: 'row-1',
    productId: 'p-1',
    productCode: 'PC-001',
    productName: 'Basmati Rice',
    productType: 'Grocery',
    baseUnit: 'kg',
    unitId: null,
    unitName: 'kg',
    unitPrice: 1200,
    conversionFactor: 1,
    quantity: 1,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
    lineSubtotal: 1200,
    lineDiscountAmount: 0,
    lineTaxAmount: 0,
    lineTotal: 1200,
    baseUnitQty: 1,
};

function renderTable(
    overrides: Partial<Parameters<typeof PosItemTable>[0]> = {},
) {
    const props: Parameters<typeof PosItemTable>[0] = {
        cart: [],
        addItem: vi.fn(),
        updateItem: vi.fn(),
        removeItem: vi.fn(),
        ...overrides,
    };
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    render(<PosItemTable {...props} />, { wrapper: Wrapper });
    return props;
}

describe('PosItemTable', () => {
    beforeEach(() => {
        searchMock.mockReset();
        unitsMock.mockReset();
        unitsMock.mockResolvedValue([]);
    });

    it('shows the empty-state when the cart is empty', () => {
        renderTable();
        expect(screen.getByText(/No items yet/i)).toBeInTheDocument();
        expect(
            screen.getByText(/Search a product to add it to the cart/i),
        ).toBeInTheDocument();
    });

    it('renders the cart row and Items header when a row exists', () => {
        renderTable({ cart: [stagedItem] });
        expect(screen.getByRole('heading', { name: /Items/i })).toBeInTheDocument();
        expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
        expect(screen.queryByText(/No items yet/i)).not.toBeInTheDocument();
    });

    it('calls addItem with the selected product seeded as a fresh cart line', async () => {
        searchMock.mockResolvedValueOnce([searchRow]);
        const addItem = vi.fn();
        renderTable({ addItem });

        // Type triggers the debounce; we type one char and wait.
        await userEvent.type(
            screen.getByRole('textbox', { name: 'Search products' }),
            'rice',
        );

        await waitFor(() =>
            expect(screen.getByText('Basmati Rice')).toBeInTheDocument(),
        );

        // Click the inner result button — getByRole('option') points at
        // the wrapping <li>, which does not own the click handler.
        await userEvent.click(
            screen.getByRole('button', { name: /Basmati Rice/i }),
        );

        expect(addItem).toHaveBeenCalledTimes(1);
        const seed = addItem.mock.calls[0][0];
        expect(seed).toMatchObject({
            productId: 'p-1',
            productCode: 'PC-001',
            productName: 'Basmati Rice',
            unitId: null,
            unitName: 'kg',
            unitPrice: 1200,
            conversionFactor: 1,
            quantity: 1,
            free: 0,
            discountPercentage: 0,
            taxRate: 0,
            discountAllowed: true,
        });
    });

});
