import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerRequestsService } from '@/services/customer-requests.service';
import { useConfirm } from '@/hooks/useConfirm';
import { queryKeys } from '@/lib/queryKeys';

interface UseRequestActionsArgs {
    onCleared: () => void;
}

export function useRequestActions({ onCleared }: UseRequestActionsArgs) {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [actionPending, setActionPending] = useState(false);

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: queryKeys.customerRequests.all(),
        });

    const onAccept = async (id: string) => {
        setActionPending(true);
        try {
            await customerRequestsService.acceptByStaff(id);
            toast.success('Request accepted');
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
            title: 'Reject this request?',
            body: 'The customer will be notified that their pickup request was declined.',
            confirmLabel: 'Reject request',
            tone: 'danger',
        });
        if (!ok) return;
        setActionPending(true);
        try {
            await customerRequestsService.rejectByStaff(id);
            toast.success('Request rejected');
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
