import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { stockTransfersService } from '@/services/stock-transfers.service';
import type { ICreateManagerBatchTransferPayload } from '@/types';

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

interface UseTransferRequestCreateArgs {
    onSuccess: (count: number) => void;
}

export function useTransferRequestCreate({
    onSuccess,
}: UseTransferRequestCreateArgs) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: ICreateManagerBatchTransferPayload) =>
            stockTransfersService.createManagerBatch(payload),
        onSuccess: (created) => {
            queryClient.invalidateQueries({
                queryKey: ['stock-transfers'],
            });
            toast.success(
                `Submitted ${created.length} request${created.length === 1 ? '' : 's'}`,
            );
            onSuccess(created.length);
        },
        onError: (err: unknown) =>
            toast.error(
                extractApiMessage(err) ?? 'Could not submit transfer request',
            ),
    });
}
