import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockTransfersService } from '@/services/stock-transfers.service';
import type { ICreateAdminDirectTransferPayload } from '@/types';

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

interface UseAdminTransferCreateArgs {
    onSuccess: (count: number) => void;
}

export function useAdminTransferCreate({
    onSuccess,
}: UseAdminTransferCreateArgs) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ICreateAdminDirectTransferPayload) =>
            stockTransfersService.createAdminDirect(payload),
        onSuccess: (created) => {
            queryClient.invalidateQueries({
                queryKey: ['stock-transfers'],
            });
            toast.success(
                `Created ${created.length} transfer${created.length === 1 ? '' : 's'}`,
            );
            onSuccess(created.length);
        },
        onError: (err: unknown) =>
            toast.error(
                extractApiMessage(err) ?? 'Could not create transfers',
            ),
    });
}
