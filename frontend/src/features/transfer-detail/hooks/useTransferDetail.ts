import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IStockTransferRequest } from '@/types';

interface ApprovePayload {
    sourceBranchId: string;
    approvedQuantity: number;
    approvalNote?: string;
}

function extractErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err) && err.response?.data?.message) {
        return String(err.response.data.message);
    }
    return fallback;
}

export function useTransferDetail(id: string | undefined) {
    const queryClient = useQueryClient();
    const [submitting, setSubmitting] = useState(false);

    const query = useQuery<IStockTransferRequest>({
        queryKey: queryKeys.stockTransfers.byId(id ?? ''),
        queryFn: () => stockTransfersService.getById(id ?? ''),
        enabled: Boolean(id),
    });

    const invalidate = () =>
        queryClient.invalidateQueries({
            queryKey: ['stock-transfers'],
        });

    async function runAction<T>(
        op: () => Promise<T>,
        successMessage: string,
        failureMessage: string,
    ): Promise<boolean> {
        if (!id) return false;
        setSubmitting(true);
        try {
            await op();
            toast.success(successMessage);
            await invalidate();
            return true;
        } catch (err) {
            toast.error(extractErrorMessage(err, failureMessage));
            return false;
        } finally {
            setSubmitting(false);
        }
    }

    return {
        transfer: query.data ?? null,
        isLoading: query.isLoading && Boolean(id),
        error: query.error ? 'Could not load transfer details' : null,
        submitting,
        approve: (payload: ApprovePayload) =>
            runAction(
                () => stockTransfersService.approve(id ?? '', payload),
                'Transfer approved',
                'Failed to approve transfer',
            ),
        reject: (reason: string) =>
            runAction(
                () => stockTransfersService.reject(id ?? '', reason),
                'Transfer rejected',
                'Failed to reject transfer',
            ),
        cancel: () =>
            runAction(
                () => stockTransfersService.cancel(id ?? ''),
                'Transfer cancelled',
                'Failed to cancel transfer',
            ),
        ship: () =>
            runAction(
                () => stockTransfersService.ship(id ?? ''),
                'Transfer marked as shipped',
                'Failed to ship transfer',
            ),
        receive: () =>
            runAction(
                () => stockTransfersService.receive(id ?? ''),
                'Transfer received',
                'Failed to receive transfer',
            ),
    };
}
