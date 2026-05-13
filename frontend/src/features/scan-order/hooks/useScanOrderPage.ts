import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerOrder } from '@/types';
import type { Payment } from '../types/payment.type';

export function useScanOrderPage() {
    const navigate = useNavigate();
    const manualInputRef = useRef<HTMLInputElement>(null);
    const [order, setOrder] = useState<ICustomerOrder | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<Payment>('cash');
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [manualCode, setManualCode] = useState('');

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

    const handleConfirm = async () => {
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
            navigate(FRONTEND_ROUTES.POS);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not complete pickup');
            } else {
                toast.error('Could not complete pickup');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setOrder(null);
        setManualCode('');
    };

    const isOpen =
        order?.status === 'pending' || order?.status === 'accepted';
    const requiresPayment =
        !!order &&
        order.paymentMode === 'manual' &&
        order.paymentStatus !== 'paid';
    const isOnlineBlocked =
        !!order &&
        order.paymentMode === 'online' &&
        order.paymentStatus !== 'paid';
    const isFulfillable =
        !!order && isOpen && !isOnlineBlocked;

    return {
        request: order,
        paymentMethod,
        setPaymentMethod,
        loading,
        submitting,
        manualCode,
        setManualCode,
        manualInputRef,
        lookup,
        handleManualSubmit,
        handleConfirm,
        reset,
        isFulfillable,
        requiresPayment,
        isOnlineBlocked,
        goToPos: () => navigate(FRONTEND_ROUTES.POS),
    };
}
