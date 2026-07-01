import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import type { ICustomerOrder } from '@/types';
import { useOrderFulfillment } from './useOrderFulfillment';

interface UseScanOrderOptions {
    /** Called after a successful fulfillment — e.g. flip the POS back to billing. */
    onDone?: () => void;
}

/**
 * Scan-and-pick state: order lookup by code plus fulfillment. Fulfillment logic
 * lives in the shared `useOrderFulfillment` hook; this hook adds the code-lookup
 * layer. Host-agnostic — the POS "Scan Pickup" mode passes `onDone` to return to
 * billing once the pickup is confirmed.
 */
export function useScanOrder({ onDone }: UseScanOrderOptions = {}) {
    const manualInputRef = useRef<HTMLInputElement>(null);
    const [order, setOrder] = useState<ICustomerOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [manualCode, setManualCode] = useState('');

    const reset = useCallback(() => {
        setOrder(null);
        setManualCode('');
    }, []);

    const fulfillment = useOrderFulfillment({
        order,
        onFulfilled: () => {
            reset();
            onDone?.();
        },
    });

    useEffect(() => {
        manualInputRef.current?.focus();
    }, []);

    const lookup = useCallback(async (codeRaw: string) => {
        const code = codeRaw.trim();
        if (!code) return;
        setLoading(true);
        try {
            const found = await customerOrdersService.findByCodeStaff(code);
            setOrder(found);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                toast.error('Order not found');
            } else {
                toast.error('Lookup failed');
            }
            setOrder(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void lookup(manualCode);
    };

    return {
        request: order,
        paymentMethod: fulfillment.paymentMethod,
        setPaymentMethod: fulfillment.setPaymentMethod,
        loading,
        submitting: fulfillment.submitting,
        manualCode,
        setManualCode,
        manualInputRef,
        lookup,
        handleManualSubmit,
        handleConfirm: fulfillment.handleConfirm,
        reset,
        isFulfillable: fulfillment.isFulfillable,
        requiresPayment: fulfillment.requiresPayment,
        isOnlineBlocked: fulfillment.isOnlineBlocked,
    };
}
