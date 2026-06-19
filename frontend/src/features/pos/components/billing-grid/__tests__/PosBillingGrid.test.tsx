import { describe, it, expect, vi } from 'vitest';
import { useEffect, useRef, useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    it('adds a line on pick at quantity 1: item → Enter', () => {
        const { addItem } = setup([]);
        const itemInput = screen.getByLabelText('Add item');
        fireEvent.change(itemInput, { target: { value: 'milk' } });
        fireEvent.keyDown(itemInput, { key: 'Enter' }); // pick → auto-adds

        expect(addItem).toHaveBeenCalledTimes(1);
        expect(addItem.mock.calls[0][0]).toMatchObject({
            productId: 'p1',
            quantity: 1,
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

    /**
     * Stateful harness where `addItem` actually grows the cart, mirroring the
     * real `usePosCart`-driven flow so the entry row re-renders after a commit.
     * Reproduces "enter one product, can't get an input box for the next".
     */
    function StatefulGrid() {
        const [cart, setCart] = useState<ICartItem[]>([]);
        return (
            <PosBillingGrid
                cart={cart}
                addItem={() =>
                    setCart((c) => [
                        ...c,
                        cartItem({ rowId: `r${c.length + 1}` }),
                    ])
                }
                updateItem={vi.fn()}
                removeItem={vi.fn()}
                onClear={vi.fn()}
            />
        );
    }

    function addOneLine() {
        const itemInput = screen.getByLabelText('Add item');
        fireEvent.change(itemInput, { target: { value: 'milk' } });
        fireEvent.keyDown(itemInput, { key: 'Enter' }); // pick → auto-adds qty 1
    }

    it('clears+refocuses the Item input on pick so a second product follows', async () => {
        render(<StatefulGrid />);

        addOneLine();

        // First line landed in the cart at quantity 1.
        expect(screen.getAllByText('Milk 1L').length).toBeGreaterThanOrEqual(1);

        // The entry Item input is cleared (ready for the next product) and
        // re-focused, so the cashier can keep typing without clicking back.
        const entryInput = screen.getByLabelText('Add item') as HTMLInputElement;
        expect(entryInput.value).toBe('');
        await waitFor(() =>
            expect(document.activeElement).toBe(
                screen.getByLabelText('Add item'),
            ),
        );

        // And a second product can actually be entered.
        addOneLine();
        expect(screen.getAllByText('Milk 1L').length).toBe(2);
    });

    /**
     * Steals focus when it mounts — stand-in for the page-level work that
     * fires when the cart goes 0→1 in the real `PosPage` (the payment panel
     * appears). Reproduces the "first line eats the next keystrokes" report.
     */
    function FocusStealer() {
        const ref = useRef<HTMLInputElement>(null);
        useEffect(() => {
            ref.current?.focus();
        }, []);
        return <input ref={ref} aria-label="stealer" />;
    }

    function StatefulGridWithStealer() {
        const [cart, setCart] = useState<ICartItem[]>([]);
        return (
            <div>
                <PosBillingGrid
                    cart={cart}
                    addItem={() =>
                        setCart((c) => [
                            ...c,
                            cartItem({ rowId: `r${c.length + 1}` }),
                        ])
                    }
                    updateItem={vi.fn()}
                    removeItem={vi.fn()}
                    onClear={vi.fn()}
                />
                {cart.length > 0 ? <FocusStealer /> : null}
            </div>
        );
    }

    it('reclaims focus to the Item input after a page-level focus steal', async () => {
        render(<StatefulGridWithStealer />);

        addOneLine();
        // The stealer grabbed focus when it mounted on the first line; the
        // entry-row commit must reclaim it (next frame) so the cashier can
        // keep entering products without clicking back into the input.
        await waitFor(() =>
            expect(document.activeElement).toBe(
                screen.getByLabelText('Add item'),
            ),
        );
    });
});
