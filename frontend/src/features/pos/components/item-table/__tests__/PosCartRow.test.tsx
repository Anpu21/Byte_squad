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
    onUpdate?: ReturnType<typeof vi.fn<(rowId: string, patch: Partial<ICartItem>) => void>>;
    onRemove?: ReturnType<typeof vi.fn<(rowId: string) => void>>;
} = {}) {
    const onUpdate = props.onUpdate ?? vi.fn<(rowId: string, patch: Partial<ICartItem>) => void>();
    const onRemove = props.onRemove ?? vi.fn<(rowId: string) => void>();
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
        // The input is controlled; typing into a buffer initialized to "2"
        // appends. After the first keystroke the buffer reads "25" — a
        // complete number, so it commits.
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

    it('keeps mid-typing decimal entries and commits on blur', async () => {
        const { onUpdate } = renderRow({ quantity: 0 });
        const input = screen.getByLabelText('Quantity') as HTMLInputElement;
        // Clear the field and re-enter — typing "0." should not collapse to
        // 0; the user can keep typing and eventually land on 0.5.
        await userEvent.clear(input);
        await userEvent.type(input, '0.5');
        // Final state: full number, commit fires with the decimal value.
        expect(onUpdate).toHaveBeenLastCalledWith('row-1', { quantity: 0.5 });
        expect(input.value).toBe('0.5');
    });

    it('clamps an out-of-range discount paste to the max bound', async () => {
        const { onUpdate } = renderRow({ discountPercentage: 0 });
        const input = screen.getByLabelText(
            'Discount percentage',
        ) as HTMLInputElement;
        await userEvent.clear(input);
        // Programmatic-set / paste of 200 — clamp must pull it back to 100.
        await userEvent.type(input, '200');
        const lastCall = onUpdate.mock.calls.at(-1);
        expect(lastCall).toEqual(['row-1', { discountPercentage: 100 }]);
    });

    it('silently rejects non-numeric keystrokes via isPartialDecimal', async () => {
        const { onUpdate } = renderRow({ quantity: 1 });
        const input = screen.getByLabelText('Quantity') as HTMLInputElement;
        await userEvent.clear(input);
        // Letters typed alongside digits are dropped character-by-character
        // by the onChange filter, so the buffer never holds `12abc`.
        await userEvent.type(input, '12abc');
        expect(input.value).toBe('12');
        // commit fires for `12` (the complete number), but never with NaN.
        const lastCall = onUpdate.mock.calls.at(-1);
        expect(lastCall).toEqual(['row-1', { quantity: 12 }]);
    });

    it('renders as a plain text input with decimal inputMode', () => {
        renderRow({ quantity: 1 });
        const input = screen.getByLabelText('Quantity') as HTMLInputElement;
        // No native number spinner arrows or scroll-wheel value mutation —
        // the cell is type="text" with inputMode="decimal" so mobile
        // keyboards still surface the numeric keypad.
        expect(input.type).toBe('text');
        expect(input.inputMode).toBe('decimal');
    });
});
