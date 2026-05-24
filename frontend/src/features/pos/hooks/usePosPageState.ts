import { useCallback, useRef, useState } from 'react';
import type { ISale } from '@/types';
import { useLoyaltyAttach, type IPosLoyaltyOwner } from './useLoyaltyAttach';

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
    loyaltyOwner: IPosLoyaltyOwner | null;
    setLoyaltyOwner: (owner: IPosLoyaltyOwner | null) => void;
    loyaltyRedeemPoints: number;
    setLoyaltyRedeemPoints: (next: number) => void;
}

/**
 * Owns all transient UI state for the cashier `PosPage` orchestrator so the
 * page itself stays under the 120-line budget and reads as pure composition.
 * Loyalty attach state lives in a child hook (`useLoyaltyAttach`) so each
 * file stays small and the loyalty card can read the same shape as the
 * page uses to build the create-sale payload.
 */
export function usePosPageState(): IUsePosPageStateReturn {
    const [cartDiscountPercentage, setCartDiscountPercentage] = useState(0);
    const [showPayment, setShowPayment] = useState(false);
    const [showRecent, setShowRecent] = useState(false);
    const [previewSaleId, setPreviewSaleId] = useState<string | null>(null);
    const [lastSale, setLastSale] = useState<ISale | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const loyalty = useLoyaltyAttach();

    const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
    const resetAfterCheckout = useCallback(() => {
        setCartDiscountPercentage(0);
        loyalty.resetLoyalty();
    }, [loyalty]);
    return {
        cartDiscountPercentage, setCartDiscountPercentage,
        showPayment, showRecent,
        previewSaleId, setPreviewSaleId, lastSale, setLastSale,
        searchInputRef, focusSearch, resetAfterCheckout,
        openPayment: useCallback(() => setShowPayment(true), []),
        closePayment: useCallback(() => setShowPayment(false), []),
        openRecent: useCallback(() => setShowRecent(true), []),
        closeRecent: useCallback(() => setShowRecent(false), []),
        loyaltyOwner: loyalty.loyaltyOwner,
        setLoyaltyOwner: loyalty.setLoyaltyOwner,
        loyaltyRedeemPoints: loyalty.loyaltyRedeemPoints,
        setLoyaltyRedeemPoints: loyalty.setLoyaltyRedeemPoints,
    };
}
