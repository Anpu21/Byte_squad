import { describe, it, expect } from 'vitest';
import { buyAgainCandidates } from './buy-again';
import type { ICustomerOrder, IShopProduct } from '@/types';

function product(
    id: string,
    name = id,
    stockStatus: IShopProduct['stockStatus'] = 'in',
): IShopProduct {
    return {
        id,
        name,
        description: null,
        category: 'beverages',
        sellingPrice: 100,
        imageUrl: null,
        stockStatus,
        availableBranches: [],
    };
}

function order(
    id: string,
    status: ICustomerOrder['status'],
    itemIds: string[],
): ICustomerOrder {
    return {
        id,
        orderCode: `ORD-${id}`,
        userId: 'u1',
        branchId: 'b1',
        status,
        estimatedTotal: 0,
        loyaltyDiscountAmount: 0,
        finalTotal: 0,
        paymentMode: 'manual',
        paymentStatus: 'unpaid',
        loyaltyPointsRedeemed: 0,
        loyaltyPointsEarned: 0,
        guestName: null,
        note: null,
        fulfilledTransactionId: null,
        qrCodeUrl: null,
        items: itemIds.map((pid, idx) => ({
            id: `i-${id}-${idx}`,
            productId: pid,
            quantity: 1,
            unitPriceSnapshot: 100,
        })),
        createdAt: '2026-05-13T00:00:00Z',
        updatedAt: '2026-05-13T00:00:00Z',
    };
}

describe('buyAgainCandidates', () => {
    it('returns empty when no orders', () => {
        expect(buyAgainCandidates([], [product('a')])).toEqual([]);
    });

    it('returns empty when no catalog', () => {
        expect(buyAgainCandidates([order('o1', 'completed', ['a'])], [])).toEqual(
            [],
        );
    });

    it('counts products across orders and sorts by frequency desc', () => {
        const orders = [
            order('o1', 'completed', ['a', 'b']),
            order('o2', 'completed', ['a']),
            order('o3', 'accepted', ['b', 'c']),
        ];
        const catalog = [product('a'), product('b'), product('c')];

        const result = buyAgainCandidates(orders, catalog);
        expect(result.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    });

    it('excludes cancelled / rejected / expired orders', () => {
        const orders = [
            order('o1', 'cancelled', ['a', 'a']),
            order('o2', 'rejected', ['a']),
            order('o3', 'expired', ['a']),
            order('o4', 'completed', ['b']),
        ];
        const catalog = [product('a'), product('b')];

        const result = buyAgainCandidates(orders, catalog);
        expect(result.map((p) => p.id)).toEqual(['b']);
    });

    it('excludes products in excludeIds', () => {
        const orders = [order('o1', 'completed', ['a', 'b'])];
        const catalog = [product('a'), product('b')];

        const result = buyAgainCandidates(orders, catalog, ['a']);
        expect(result.map((p) => p.id)).toEqual(['b']);
    });

    it('excludes out-of-stock products', () => {
        const orders = [order('o1', 'completed', ['a', 'b'])];
        const catalog = [product('a', 'a', 'out'), product('b')];

        const result = buyAgainCandidates(orders, catalog);
        expect(result.map((p) => p.id)).toEqual(['b']);
    });

    it('respects the limit', () => {
        const orders = [order('o1', 'completed', ['a', 'b', 'c', 'd', 'e'])];
        const catalog = ['a', 'b', 'c', 'd', 'e'].map((id) => product(id));

        const result = buyAgainCandidates(orders, catalog, [], 3);
        expect(result).toHaveLength(3);
    });

    it('breaks ties alphabetically by name', () => {
        const orders = [order('o1', 'completed', ['c', 'a', 'b'])];
        const catalog = [product('a'), product('b'), product('c')];

        const result = buyAgainCandidates(orders, catalog);
        expect(result.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    });
});
