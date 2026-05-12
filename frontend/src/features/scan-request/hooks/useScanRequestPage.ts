import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { customerRequestsService } from '@/services/customer-requests.service';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/lib/utils';
import type { ICustomerRequest } from '@/types';
import type { Payment } from '../types/payment.type';

export function useScanRequestPage() {
    const navigate = useNavigate();
    const manualInputRef = useRef<HTMLInputElement>(null);
    const [request, setRequest] = useState<ICustomerRequest | null>(null);
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
            const found = await customerRequestsService.findByCodeStaff(code);
            setRequest(found);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                toast.error('Request not found');
            } else {
                toast.error('Lookup failed');
            }
            setRequest(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void lookup(manualCode);
    };

    const handleConfirm = async () => {
        if (!request) return;
        setSubmitting(true);
        try {
            await customerRequestsService.fulfill(request.requestCode, {
                paymentMethod,
            });
            toast.success(
                `Charged ${formatCurrency(Number(request.estimatedTotal))} via ${paymentMethod}`,
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
        setRequest(null);
        setManualCode('');
    };

    const isFulfillable =
        request?.status === 'pending' || request?.status === 'accepted';

    return {
        request,
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
        goToPos: () => navigate(FRONTEND_ROUTES.POS),
    };
}
