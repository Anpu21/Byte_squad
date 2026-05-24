import { useCallback, useRef, useState } from 'react';
import type { ISale } from '@/types';

interface IUsePosPageStateReturn {
    cartDiscountPercentage: number;
    setCartDiscountPercentage: (next: number) => void;
    showPayment: boolean;
    showRecent: boolean;
    previewSaleId: string | null;
    setPreviewSaleId: (saleId: string | null) => void;
    lastSale: ISale | null;
    setLastSale: (sale: ISale | null) => void;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    openPayment: () => void;
    closePayment: () => void;
    openRecent: () => void;
    closeRecent: () => void;
    focusSearch: () => void;
    resetAfterCheckout: () => void;
}

/**
 * Owns all transient UI state for the cashier `PosPage` orchestrator so the
 * page itself stays under the 120-line budget and reads as pure composition.
 * The single-shop retail POS no longer tracks walk-in customers, so all
 * customer-attached state has been removed.
 */
export function usePosPageState(): IUsePosPageStateReturn {
    const [cartDiscountPercentage, setCartDiscountPercentage] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [previewSaleId, setPreviewSaleId] = useState<string | null>(null);
    const [lastSale, setLastSale] = useState<ISale | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
    const resetAfterCheckout = useCallback(() => {
        setCartDiscountPercentage(0);
    }, []);
    return {
        cartDiscountPercentage, setCartDiscountPercentage,
        showPayment, showRecent,
        previewSaleId, setPreviewSaleId, lastSale, setLastSale,
        searchInputRef, focusSearch, resetAfterCheckout,
        openPayment: useCallback(() => setShowPayment(true), []),
        closePayment: useCallback(() => setShowPayment(false), []),
        openRecent: useCallback(() => setShowRecent(true), []),
        closeRecent: useCallback(() => setShowRecent(false), []),
    };
}
