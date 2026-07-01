import { useCallback, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import type { Payment } from '../types/payment.type';

interface UseOrderFulfillmentOptions {
    /** The order being collected, or `null` when nothing is selected. */
    order: ICustomerOrder | null;
    /** Called after a successful pickup confirmation. */
    onFulfilled?: () => void;
}

/**
 * Pickup-order collection: derives the collectable/payment flags for the
 * selected order and runs the fulfill call. Host-agnostic — the standalone
 * Scan-Pickup view and the POS Pickup queue both drive it with whichever order
 * is in focus (scanned, looked up, or row-selected).
 */
export function useOrderFulfillment({
    order,
    onFulfilled,
}: UseOrderFulfillmentOptions) {
    const [paymentMethod, setPaymentMethod] = useState<Payment>('cash');
    const [submitting, setSubmitting] = useState(false);

    // Pending / the legacy accepted state are the only collectable ones. A
    // pay-at-pickup order still owes a tender; an online order must already be
    // paid before it can be handed over.
    const isOpen = order?.status === 'pending' || order?.status === 'accepted';
    const requiresPayment =
        !!order &&
        order.paymentMode === 'manual' &&
        order.paymentStatus !== 'paid';
    const isOnlineBlocked =
        !!order &&
        order.paymentMode === 'online' &&
        order.paymentStatus !== 'paid';
    const isFulfillable = !!order && isOpen && !isOnlineBlocked;

    const handleConfirm = useCallback(async () => {
        if (!order) return;
        setSubmitting(true);
        try {
            await customerOrdersService.fulfill(
                order.orderCode,
                requiresPayment ? { paymentMethod } : {},
            );
            toast.success(
                requiresPayment
                    ? `Charged ${formatCurrency(Number(order.finalTotal))} via ${paymentMethod}`
                    : 'Pickup confirmed',
            );
            onFulfilled?.();
        } catch (err: unknown) {
            const fallback = 'Could not complete pickup';
            const message = axios.isAxiosError(err)
                ? ((err.response?.data as { message?: string } | undefined)
                      ?.message ?? fallback)
                : fallback;
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    }, [order, requiresPayment, paymentMethod, onFulfilled]);

    return {
        paymentMethod,
        setPaymentMethod,
        submitting,
        isFulfillable,
        requiresPayment,
        isOnlineBlocked,
        handleConfirm,
    };
}
