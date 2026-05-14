import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '@/hooks/useConfirm';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { useTransferRequestCart } from './useTransferRequestCart';
import { useTransferRequestCreate } from './useTransferRequestCreate';
import { buildManagerBatchPayload } from '../helpers/build-payload';

export function useTransferRequestCreatePage() {
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [reason, setReason] = useState<string>('');

    const cart = useTransferRequestCart();
    const createMutation = useTransferRequestCreate({
        onSuccess: () => {
            cart.clearCart();
            setReason('');
            navigate(FRONTEND_ROUTES.TRANSFERS);
        },
    });

    const trimmedReason = reason.trim();
    const hasReason = trimmedReason.length > 0;

    const canSubmit =
        cart.lines.length > 0 &&
        cart.lines.every((line) => line.quantity > 0) &&
        hasReason &&
        !createMutation.isPending;

    const goBack = () => navigate(FRONTEND_ROUTES.TRANSFERS);

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const ok = await confirm({
            title: 'Submit transfer request?',
            body: `Ask admin to send ${cart.totalUnits} unit(s) across ${cart.lines.length} product(s) to your branch. Each line becomes a pending request the admin can approve or reject.`,
            confirmLabel: `Submit ${cart.lines.length} request${cart.lines.length === 1 ? '' : 's'}`,
        });
        if (!ok) return;
        createMutation.mutate(
            buildManagerBatchPayload({
                requestReason: trimmedReason,
                lines: cart.lines,
            }),
        );
    };

    return {
        cart,
        reason,
        setReason,
        hasReason,
        canSubmit,
        isSubmitting: createMutation.isPending,
        handleSubmit,
        goBack,
    };
}
