import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/pos.service';
import type { ICreateTransactionPayload } from '@/services/pos.service';
import type { CartItem } from '../types/cart-item.type';

interface LastTransactionInfo {
    transactionNumber: string;
    total: number;
}

interface UsePosCheckoutOptions {
    cart: CartItem[];
    total: number;
    onSuccess: () => void;
}

export function usePosCheckout({
    cart,
    total,
    onSuccess,
}: UsePosCheckoutOptions) {
    const queryClient = useQueryClient();
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTransaction, setLastTransaction] =
        useState<LastTransactionInfo | null>(null);
    const [cashTendered, setCashTendered] = useState('');

    // Synchronous in-flight guard — prevents a double-fire from a fast Enter-
    // key press before `isCheckingOut` updates.
    const inFlightRef = useRef(false);
    const idempotencyKeyRef = useRef<string | null>(null);

    // Fresh idempotency key per payment-modal session; reused across retries
    // within the same attempt so the backend can de-dupe a network retry.
    useEffect(() => {
        if (showPaymentModal) {
            idempotencyKeyRef.current =
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                    ? crypto.randomUUID()
                    : `pos-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        } else {
            idempotencyKeyRef.current = null;
        }
    }, [showPaymentModal]);

    const openPaymentModal = useCallback(() => {
        if (cart.length === 0) return;
        setShowPaymentModal(true);
        setCashTendered('');
    }, [cart.length]);

    const closePaymentModal = useCallback(() => {
        setShowPaymentModal(false);
    }, []);

    const cashChange = cashTendered
        ? Math.max(0, parseFloat(cashTendered) - total)
        : 0;

    const handleCheckout = useCallback(async () => {
        if (cart.length === 0) return;
        if (inFlightRef.current) return;
        inFlightRef.current = true;
        setIsCheckingOut(true);
        setError(null);

        const payload: ICreateTransactionPayload = {
            type: 'sale',
            paymentMethod: 'cash',
            items: cart.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                ...(item.lineDiscountAmount && item.lineDiscountAmount > 0
                    ? {
                          discountAmount: item.lineDiscountAmount,
                          discountType: 'percentage',
                      }
                    : {}),
            })),
        };

        try {
            const transaction = await posService.createTransaction(
                payload,
                idempotencyKeyRef.current ?? undefined,
            );
            setLastTransaction({
                transactionNumber: transaction.transactionNumber,
                total: Number(transaction.total),
            });
            setShowPaymentModal(false);
            setCashTendered('');
            await queryClient.invalidateQueries({ queryKey: ['inventory'] });
            onSuccess();
        } catch (err: unknown) {
            const apiMessage = axios.isAxiosError(err)
                ? (
                      err.response?.data as
                          | { message?: string | string[] }
                          | undefined
                  )?.message
                : null;
            const message = Array.isArray(apiMessage)
                ? apiMessage.join(', ')
                : apiMessage;
            setError(message ?? 'Failed to complete sale. Please try again.');
        } finally {
            setIsCheckingOut(false);
            inFlightRef.current = false;
        }
    }, [cart, onSuccess, queryClient]);

    const dismissLastTransaction = useCallback(() => {
        setLastTransaction(null);
    }, []);

    const dismissError = useCallback(() => setError(null), []);

    return {
        showPaymentModal,
        openPaymentModal,
        closePaymentModal,
        cashTendered,
        setCashTendered,
        cashChange,
        isCheckingOut,
        error,
        dismissError,
        lastTransaction,
        dismissLastTransaction,
        handleCheckout,
    };
}
