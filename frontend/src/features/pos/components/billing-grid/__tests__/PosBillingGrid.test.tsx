import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ISearchProductRow } from '@/types';
import type { ICartItem } from '@/features/pos/types/cart-item.type';

const MOCK_RESULTS = [
    {
        productId: 'p1',
        productCode: 'C1',
        productName: 'Milk 1L',
        productType: 'Dairy',
        baseUnit: 'unit',
        retailPrice: 250,
        mrp: 300,
        taxRate: 0,
        discountAllowed: true,
        matchedUnit: null,
    },
] as unknown as ISearchProductRow[];

// The entry row's autocomplete + the committed rows' unit dropdown both lean
// on react-query hooks; stub them so the grid renders without a QueryClient.
vi.mock('@/features/pos/hooks/usePosProductSearch', () => ({
    usePosProductSearch: () => ({ data: MOCK_RESULTS, isFetching: false }),
}));
vi.mock('@/features/pos/hooks/usePosProductUnits', () => ({
    usePosProductUnits: () => ({ data: [], isLoading: false }),
}));
vi.mock('@/hooks/useConfirm', () => ({
    useConfirm: () => vi.fn().mockResolvedValue(true),
}));

import { PosBillingGrid } from '../PosBillingGrid';

function cartItem(over: Partial<ICartItem> = {}): ICartItem {
    return {
        rowId: 'r1',
        productId: 'p1',
        productCode: 'C1',
        productName: 'Milk 1L',
        productType: 'Dairy',
        baseUnit: 'unit',
        unitId: null,
        unitName: 'unit',
        unitPrice: 250,
        mrp: 300,
        conversionFactor: 1,
        quantity: 2,
        free: 0,
        discountPercentage: 0,
        taxRate: 0,
        discountAllowed: true,
        lineSubtotal: 500,
        lineDiscountAmount: 0,
        lineTaxAmount: 0,
        lineTotal: 500,
        baseUnitQty: 2,
        ...over,
    };
}

function setup(cart: ICartItem[] = []) {
    const addItem = vi.fn();
    const updateItem = vi.fn();
    const removeItem = vi.fn();
    render(
        <PosBillingGrid
            cart={cart}
            addItem={addItem}
            updateItem={updateItem}
            removeItem={removeItem}
            onClear={vi.fn()}
        />,
    );
    return { addItem, updateItem, removeItem };
}

describe('PosBillingGrid', () => {
    it('adds a line keyboard-first: item → Enter → qty → Enter', () => {
        const { addItem } = setup([]);
        const itemInput = screen.getByLabelText('Add item');
        fireEvent.change(itemInput, { target: { value: 'milk' } });
        fireEvent.keyDown(itemInput, { key: 'Enter' });

        const qty = screen.getByLabelText('New line quantity');
        fireEvent.change(qty, { target: { value: '3' } });
        fireEvent.keyDown(qty, { key: 'Enter' });

        expect(addItem).toHaveBeenCalledTimes(1);
        expect(addItem.mock.calls[0][0]).toMatchObject({
            productId: 'p1',
            quantity: 3,
        });
    });

    it('edits a committed quantity cell → updateItem', () => {
        const { updateItem } = setup([cartItem()]);
        expect(screen.getByText('Milk 1L')).toBeInTheDocument();
        const qty = screen.getByLabelText('Quantity');
        fireEvent.change(qty, { target: { value: '5' } });
        expect(updateItem).toHaveBeenCalledWith('r1', { quantity: 5 });
    });

    it('removes a committed row on Ctrl+Delete', () => {
        const { removeItem } = setup([cartItem()]);
        const qty = screen.getByLabelText('Quantity');
        fireEvent.keyDown(qty, { key: 'Delete', ctrlKey: true });
        expect(removeItem).toHaveBeenCalledWith('r1');
    });
});
