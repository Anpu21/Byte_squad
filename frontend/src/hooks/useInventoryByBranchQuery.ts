import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IInventoryParams } from '@/types';

interface UseInventoryByBranchQueryOptions {
    enabled?: boolean;
}

export function useInventoryByBranchQuery(
    branchId: string | null | undefined,
    params?: IInventoryParams,
    options?: UseInventoryByBranchQueryOptions,
) {
    return useQuery({
        queryKey: queryKeys.inventory.byBranch(branchId ?? '', params),
        queryFn: () => inventoryService.getByBranch(branchId ?? '', params),
        enabled: Boolean(branchId) && (options?.enabled ?? true),
    });
}
