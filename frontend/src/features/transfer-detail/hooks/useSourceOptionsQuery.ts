import { useQuery } from '@tanstack/react-query';
import { stockTransfersService } from '@/services/stock-transfers.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ITransferSourceOption } from '@/types';

export function useSourceOptionsQuery(
    transferId: string | undefined,
    enabled: boolean,
) {
    return useQuery<ITransferSourceOption[]>({
        queryKey: queryKeys.stockTransfers.sourceOptions(transferId ?? ''),
        queryFn: () =>
            stockTransfersService.getSourceOptions(transferId ?? ''),
        enabled: enabled && Boolean(transferId),
    });
}
