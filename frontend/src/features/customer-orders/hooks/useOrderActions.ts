import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';
import { FRONTEND_ROUTES } from '@/constants/routes';
import type { ICustomerOrder } from '@/types';

interface UseOrderActionsArgs {
    onCleared: () => void;
}

export function useOrderActions({ onCleared }: UseOrderActionsArgs) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const confirm = useConfirm();
    const [actionPending, setActionPending] = useState(false);

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: queryKeys.customerOrders.all(),
        });

    /**
     * Mark an order collected. Online pre-paid orders fulfil in one click;
     * pay-at-pickup orders need payment, so we send the cashier to the POS
     * Scan-Pickup flow rather than fulfilling without a tender.
     */
    const onCollect = async (order: ICustomerOrder) => {
        if (order.paymentMode === 'manual') {
            toast('Take payment at the POS — use Scan Pickup to collect', {
                icon: 'ℹ️',
            });
            navigate(FRONTEND_ROUTES.POS);
            return;
        }
        setActionPending(true);
        try {
            await customerOrdersService.fulfill(order.orderCode, {});
            toast.success('Marked collected');
            await invalidate();
            onCleared();
        } catch {
            toast.error('Could not collect — try Scan Pickup at the POS');
        } finally {
            setActionPending(false);
        }
    };

    const onMarkNotCollected = async (id: string) => {
        const ok = await confirm({
            title: 'Mark as not collected?',
            body: 'Record this pickup order as a no-show — the customer never collected it.',
            confirmLabel: 'Not collected',
            tone: 'danger',
        });
        if (!ok) return;
        setActionPending(true);
        try {
            await customerOrdersService.markNotCollected(id);
            toast.success('Marked not collected');
            await invalidate();
            onCleared();
        } catch {
            toast.error('Could not update the order');
        } finally {
            setActionPending(false);
        }
    };

    return { actionPending, onCollect, onMarkNotCollected };
}
