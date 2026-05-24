import { useCallback, useRef, useState } from 'react';
import type { ISale } from '@/types';

interface IUsePosPageStateReturn {
    customerUserId: string | null;
    setCustomerUserId: (next: string | null) => void;
    cartDiscountPercentage: number;
    setCartDiscountPercentage: (next: number) => void;
    showPayment: boolean;
    showRecent: boolean;
    customerPickerSignal: number;
    previewSaleId: string | null;
    setPreviewSaleId: (saleId: string | null) => void;
    lastSale: ISale | null;
    setLastSale: (sale: ISale | null) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    openPayment: () => void;
    closePayment: () => void;
    openRecent: () => void;
    closeRecent: () => void;
    openCustomerPicker: () => void;
    focusSearch: () => void;
    resetAfterCheckout: () => void;
}

/**
 * Owns all transient UI state for the cashier `PosPage` orchestrator so the
 * page itself stays under the 120-line budget and reads as pure composition.
 * The `customerPickerSignal` token is bumped on F4 / Customer-button click;
 * `PosCustomerInfo` reads the change as a render-time anchor and opens its
 * internal picker without us having to lift the modal state out.
 */
export function usePosPageState(): IUsePosPageStateReturn {
    const [customerUserId, setCustomerUserId] = useState<string | null>(null);
    const [cartDiscountPercentage, setCartDiscountPercentage] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [customerPickerSignal, setCustomerPickerSignal] = useState(0);
    const [previewSaleId, setPreviewSaleId] = useState<string | null>(null);
    const [lastSale, setLastSale] = useState<ISale | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
    const resetAfterCheckout = useCallback(() => {
        setCartDiscountPercentage(0);
        setCustomerUserId(null);
    }, []);
    return {
        customerUserId, setCustomerUserId,
        cartDiscountPercentage, setCartDiscountPercentage,
        showPayment, showRecent, customerPickerSignal,
        previewSaleId, setPreviewSaleId, lastSale, setLastSale,
        searchInputRef, focusSearch, resetAfterCheckout,
        openPayment: useCallback(() => setShowPayment(true), []),
        closePayment: useCallback(() => setShowPayment(false), []),
        openRecent: useCallback(() => setShowRecent(true), []),
        closeRecent: useCallback(() => setShowRecent(false), []),
        openCustomerPicker: useCallback(
            () => setCustomerPickerSignal((n) => n + 1),
            [],
        ),
    };
}
