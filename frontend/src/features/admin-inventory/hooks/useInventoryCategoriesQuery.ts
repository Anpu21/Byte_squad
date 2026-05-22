import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';
import { queryKeys } from '@/lib/queryKeys';

const STALE_MS = 10 * 60_000; // 10 minutes — categories change rarely

export function useInventoryCategoriesQuery() {
    return useQuery<string[]>({
        queryKey: queryKeys.inventory.categories(),
        queryFn: inventoryService.getCategories,
        staleTime: STALE_MS,
    });
}
