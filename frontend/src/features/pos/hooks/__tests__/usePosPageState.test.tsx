import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosPageState } from '../usePosPageState';
import { saleFixture } from './sale-fixture';

describe('usePosPageState', () => {
    it('starts with an empty cart discount and all modals closed', () => {
        const { result } = renderHook(() => usePosPageState());
        expect(result.current.cartDiscountPercentage).toBe(0);
        expect(result.current.showPayment).toBe(false);
        expect(result.current.showRecent).toBe(false);
        expect(result.current.previewSaleId).toBeNull();
        expect(result.current.lastSale).toBeNull();
    });

    it('openPayment / closePayment toggle showPayment, and resetAfterCheckout clears the cart discount', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() => result.current.setCartDiscountPercentage(15));
        act(() => result.current.openPayment());
        expect(result.current.showPayment).toBe(true);
        act(() => result.current.closePayment());
        expect(result.current.showPayment).toBe(false);
        act(() => result.current.resetAfterCheckout());
        expect(result.current.cartDiscountPercentage).toBe(0);
    });

    it('setLastSale stores the sale and setPreviewSaleId stores the preview target', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() => result.current.setLastSale(saleFixture));
        expect(result.current.lastSale).toBe(saleFixture);
        act(() => result.current.setPreviewSaleId('sale-99'));
        expect(result.current.previewSaleId).toBe('sale-99');
    });

    it('resetAfterCheckout clears the attached loyalty owner + redeem points', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() =>
            result.current.setLoyaltyOwner({
                ownerType: 'user',
                userId: 'u-1',
                loyaltyCustomerId: null,
                firstName: 'Nimal',
                pointsBalance: 100,
            }),
        );
        act(() => result.current.setLoyaltyRedeemPoints(40));
        expect(result.current.loyaltyOwner?.firstName).toBe('Nimal');
        expect(result.current.loyaltyRedeemPoints).toBe(40);

        act(() => result.current.resetAfterCheckout());
        expect(result.current.loyaltyOwner).toBeNull();
        expect(result.current.loyaltyRedeemPoints).toBe(0);
    });
});
