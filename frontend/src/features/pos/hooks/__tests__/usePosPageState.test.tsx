import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePosPageState } from '../usePosPageState';
import { saleFixture } from './sale-fixture';

describe('usePosPageState', () => {
    it('starts at Retail with no customer, an empty cart discount, and all modals closed', () => {
        const { result } = renderHook(() => usePosPageState());
        expect(result.current.priceLevel).toBe('Retail');
        expect(result.current.customerUserId).toBeNull();
        expect(result.current.cartDiscountPercentage).toBe(0);
        expect(result.current.showPayment).toBe(false);
        expect(result.current.showRecent).toBe(false);
        expect(result.current.previewSaleId).toBeNull();
        expect(result.current.lastSale).toBeNull();
        expect(result.current.customerPickerSignal).toBe(0);
    });

    it('togglePriceLevel flips Retail<->Wholesale on each call', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() => result.current.togglePriceLevel());
        expect(result.current.priceLevel).toBe('Wholesale');
        act(() => result.current.togglePriceLevel());
        expect(result.current.priceLevel).toBe('Retail');
    });

    it('openPayment / closePayment toggle showPayment, and resetAfterCheckout clears discount + customer', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() => result.current.setCustomerUserId('cust-9'));
        act(() => result.current.setCartDiscountPercentage(15));
        act(() => result.current.openPayment());
        expect(result.current.showPayment).toBe(true);
        act(() => result.current.closePayment());
        expect(result.current.showPayment).toBe(false);
        act(() => result.current.resetAfterCheckout());
        expect(result.current.customerUserId).toBeNull();
        expect(result.current.cartDiscountPercentage).toBe(0);
    });

    it('openCustomerPicker increments customerPickerSignal so PosCustomerInfo can observe each F4 press', () => {
        const { result } = renderHook(() => usePosPageState());
        const start = result.current.customerPickerSignal;
        act(() => result.current.openCustomerPicker());
        act(() => result.current.openCustomerPicker());
        expect(result.current.customerPickerSignal).toBe(start + 2);
    });

    it('setLastSale stores the sale and setPreviewSaleId stores the preview target', () => {
        const { result } = renderHook(() => usePosPageState());
        act(() => result.current.setLastSale(saleFixture));
        expect(result.current.lastSale).toBe(saleFixture);
        act(() => result.current.setPreviewSaleId('sale-99'));
        expect(result.current.previewSaleId).toBe('sale-99');
    });
});
