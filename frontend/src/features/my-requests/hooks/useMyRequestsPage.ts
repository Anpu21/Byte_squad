import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { customerRequestsService } from '@/services/customer-requests.service';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/hooks/useConfirm';

export function useMyRequestsPage() {
    const queryClient = useQueryClient();
    const confirm = useConfirm();

    const { data: requests = [], isLoading } = useQuery({
        queryKey: queryKeys.customerRequests.my(),
        queryFn: customerRequestsService.listMine,
    });

    const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
        null,
    );

    const selectedRequest =
        requests.find((r) => r.id === selectedRequestId) ?? null;

    const onCancel = async (id: string) => {
        const ok = await confirm({
            title: 'Cancel this pickup request?',
            body: "The branch won't fulfill it. You can place a new request any time.",
            confirmLabel: 'Cancel request',
            cancelLabel: 'Keep it',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await customerRequestsService.cancelMine(id);
            toast.success('Request cancelled');
            await queryClient.invalidateQueries({
                queryKey: queryKeys.customerRequests.my(),
            });
        } catch {
            toast.error('Could not cancel');
        }
    };

    return {
        requests,
        isLoading,
        selectedRequestId,
        selectedRequest,
        openDetails: setSelectedRequestId,
        closeDetails: () => setSelectedRequestId(null),
        onCancel,
    };
}
