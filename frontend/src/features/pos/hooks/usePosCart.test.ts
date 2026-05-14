import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { ConfirmContext } from '@/hooks/useConfirm';
import { usePosCart } from './usePosCart';
import type { IProduct } from '@/types';

function product(id: string, name = id, price = 10): IProduct {
    return {
        id,
        name,
        sellingPrice: price,
        category: 'misc',
        barcode: id,
    } as unknown as IProduct;
}

function wrapper({ children }: { children: ReactNode }) {
    return createElement(
        ConfirmContext.Provider,
        { value: async () => true },
        children,
    );
}

describe('usePosCart stock cap', () => {
    it('caps addToCart at the available stock when stock is provided', () => {
        const { result } = renderHook(
            () => usePosCart({ stockByProductId: { p1: 3 } }),
            { wrapper },
        );

        act(() => result.current.addToCart(product('p1'), 5));
        expect(result.current.cart[0]?.quantity).toBe(3);
        expect(result.current.blockedReason).toMatch(/Only 3 in stock/);
    });

    it('blocks further increments once at the cap', () => {
        const { result } = renderHook(
            () => usePosCart({ stockByProductId: { p1: 2 } }),
            { wrapper },
        );

        act(() => result.current.addToCart(product('p1'), 2));
        act(() => result.current.dismissBlockedReason());
        act(() => result.current.updateQuantity('p1', 5));
        expect(result.current.cart[0]?.quantity).toBe(2);
        expect(result.current.blockedReason).toMatch(/Only 2 in stock/);
    });

    it('allows unlimited quantities when stock map is missing for the product', () => {
        const { result } = renderHook(
            () => usePosCart({ stockByProductId: { other: 1 } }),
            { wrapper },
        );

        act(() => result.current.addToCart(product('p1'), 99));
        expect(result.current.cart[0]?.quantity).toBe(99);
        expect(result.current.blockedReason).toBeNull();
    });

    it('clears blockedReason on a successful mutation', () => {
        const { result } = renderHook(
            () => usePosCart({ stockByProductId: { p1: 2 } }),
            { wrapper },
        );

        act(() => result.current.addToCart(product('p1'), 5));
        expect(result.current.blockedReason).not.toBeNull();
        act(() => result.current.updateQuantity('p1', 1));
        expect(result.current.cart[0]?.quantity).toBe(1);
        expect(result.current.blockedReason).toBeNull();
    });
});
