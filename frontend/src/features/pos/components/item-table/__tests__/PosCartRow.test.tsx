import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PropsWithChildren, ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ICartItem } from '@/features/pos/types/cart-item.type';
import { PosCartRow } from '../PosCartRow';
import { posService } from '@/services/pos.service';

vi.mock('@/services/pos.service', () => ({
    posService: {
        listProductUnits: vi.fn(),
    },
}));

const listMock = vi.mocked(posService.listProductUnits);

const item: ICartItem = {
    rowId: 'row-1',
    productId: 'p-1',
    productCode: 'PC-001',
    productName: 'Basmati Rice',
    productType: 'Grocery',
    baseUnit: 'kg',
    unitId: null,
    unitName: 'kg',
    unitPrice: 100,
    conversionFactor: 1,
    quantity: 2,
    free: 0,
    discountPercentage: 0,
    taxRate: 0,
    discountAllowed: true,
    lineSubtotal: 200,
    lineDiscountAmount: 0,
    lineTaxAmount: 0,
    lineTotal: 200,
    baseUnitQty: 2,
};

function renderRow(overrides: Partial<ICartItem> = {}, props: {
    onUpdate?: ReturnType<typeof vi.fn>;
    onRemove?: ReturnType<typeof vi.fn>;
} = {}) {
    const onUpdate = props.onUpdate ?? vi.fn();
    const onRemove = props.onRemove ?? vi.fn();
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Wrapper = ({ children }: PropsWithChildren): ReactElement => (
        <QueryClientProvider client={client}>
            <table>
                <tbody>{children}</tbody>
            </table>
        </QueryClientProvider>
    );
    render(
        <PosCartRow
            item={{ ...item, ...overrides }}
            onUpdate={onUpdate}
            onRemove={onRemove}
        />,
        { wrapper: Wrapper },
    );
    return { onUpdate, onRemove };
}

describe('PosCartRow', () => {
    beforeEach(() => {
        listMock.mockReset();
        listMock.mockResolvedValue([]);
    });

    it('renders the product code, name, and formatted line total', () => {
        renderRow();
        expect(screen.getByText('PC-001')).toBeInTheDocument();
        expect(screen.getByText('Basmati Rice')).toBeInTheDocument();
        expect(
            screen.getByText((text) => /LKR\s*200\.00/.test(text)),
        ).toBeInTheDocument();
    });

    it('writes a numeric patch when quantity changes', async () => {
        const { onUpdate } = renderRow();
        const input = screen.getByLabelText('Quantity');
        // The input is controlled; typing into a value-of-2 input appends.
        // The first keystroke fires onChange with the appended string.
        await userEvent.type(input, '5');
        expect(onUpdate).toHaveBeenCalledWith('row-1', { quantity: 25 });
    });

    it('disables the discount input when discountAllowed is false', () => {
        renderRow({ discountAllowed: false });
        expect(screen.getByLabelText('Discount percentage')).toBeDisabled();
    });

    it('emits onRemove when the delete button is clicked', async () => {
        const { onRemove } = renderRow();
        await userEvent.click(
            screen.getByRole('button', { name: /remove basmati rice/i }),
        );
        expect(onRemove).toHaveBeenCalledWith('row-1');
    });
});
