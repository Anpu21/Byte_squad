import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerOrdersService } from '@/services/customer-orders.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';

interface UseOrderActionsArgs {
    onCleared: () => void;
}

export function useOrderActions({ onCleared }: UseOrderActionsArgs) {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [actionPending, setActionPending] = useState(false);

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: queryKeys.customerOrders.all(),
        });

    const onAccept = async (id: string) => {
        setActionPending(true);
        try {
            await customerOrdersService.acceptByStaff(id);
            toast.success('Order accepted');
            await invalidate();
            onCleared();
        } catch {
            toast.error('Could not accept');
        } finally {
            setActionPending(false);
        }
    };

    const onReject = async (id: string) => {
        const ok = await confirm({
            title: 'Reject this order?',
            body: 'The customer will be notified that their pickup order was declined.',
            confirmLabel: 'Reject order',
            tone: 'danger',
        });
        if (!ok) return;
        setActionPending(true);
        try {
            await customerOrdersService.rejectByStaff(id);
            toast.success('Order rejected');
            await invalidate();
            onCleared();
        } catch {
            toast.error('Could not reject');
        } finally {
            setActionPending(false);
        }
    };

    return { actionPending, onAccept, onReject };
}
